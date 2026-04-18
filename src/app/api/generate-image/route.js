import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

// Template canvas size (original PSD: 4800x3200, we use 1600x1067)
const W = 1600
const H = 1067
const S = W / 4800 // scale factor = 1/3

// Text field positions (scaled from PSD original coordinates)
const FIELDS = {
  name:     { x: 600, y: 161, w: 383, h: 58,  fontSize: 38, bold: true  },
  dob:      { x: 650, y: 255, w: 203, h: 58,  fontSize: 28, bold: false },
  hometown: { x: 677, y: 345, w: 156, h: 57,  fontSize: 28, bold: false },
  dept:     { x: 669, y: 435, w: 250, h: 52,  fontSize: 26, bold: false },
  position: { x: 285, y: 527, w: 733, h: 50,  fontSize: 26, bold: true  },
  leader:   { x: 497, y: 616, w: 217, h: 48,  fontSize: 26, bold: false },
  hobby:    { x: 450, y: 719, w: 540, h: 80,  fontSize: 22, bold: false },
  message:  { x: 430, y: 814, w: 560, h: 80,  fontSize: 22, bold: false },
  // Photo placement on right side
  photo:    { x: 974, y: 52,  w: 600, h: 853 },
}

function truncate(text, maxChars) {
  if (!text) return '—'
  return text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text
}

function makeSvgText(text, field, color = '#1a2e4a') {
  const { x, y, w, fontSize, bold } = field
  const weight = bold ? '700' : '400'
  const truncated = truncate(text, Math.floor(w / (fontSize * 0.55)))
  return `<text 
    x="${x}" y="${y + fontSize}" 
    font-family="'Be Vietnam Pro', 'Arial Unicode MS', sans-serif" 
    font-size="${fontSize}" 
    font-weight="${weight}" 
    fill="${color}"
    dominant-baseline="auto"
  >${escapeXml(truncated)}</text>`
}

function escapeXml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function makeMultilineSvgText(text, field, color = '#1a2e4a') {
  if (!text) text = '—'
  const { x, y, w, fontSize } = field
  const charsPerLine = Math.floor(w / (fontSize * 0.55))
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > charsPerLine) {
      if (current) lines.push(current.trim())
      current = word
    } else {
      current = (current + ' ' + word).trim()
    }
  }
  if (current) lines.push(current.trim())

  return lines.slice(0, 2).map((line, i) => `
    <text 
      x="${x}" y="${y + fontSize + i * (fontSize + 4)}" 
      font-family="'Be Vietnam Pro', 'Arial Unicode MS', sans-serif" 
      font-size="${fontSize}" 
      font-weight="400" 
      fill="${color}"
    >${escapeXml(line)}</text>`).join('')
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const memberJson = formData.get('member')
    const photoFile = formData.get('photo')

    if (!memberJson) {
      return Response.json({ error: 'Thiếu thông tin nhân viên' }, { status: 400 })
    }

    const member = JSON.parse(memberJson)

    // Load template image
    const templatePath = path.join(process.cwd(), 'public', 'template_clean.png')
    if (!fs.existsSync(templatePath)) {
      return Response.json({ error: 'Template không tìm thấy' }, { status: 500 })
    }

    let compositeOps = []

    // Build SVG overlay with all text fields
    const svgOverlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${makeSvgText(member.name,     FIELDS.name,     '#1a2e4a')}
      ${makeSvgText(member.dob,      FIELDS.dob,      '#2d5a4a')}
      ${makeSvgText(member.hometown, FIELDS.hometown, '#2d5a4a')}
      ${makeSvgText(member.dept,     FIELDS.dept,     '#1a7a6a')}
      ${makeSvgText(member.position, FIELDS.position, '#1a7a6a')}
      ${makeSvgText(member.leader,   FIELDS.leader,   '#2d5a4a')}
      ${makeMultilineSvgText(member.hobby,   FIELDS.hobby,   '#1a2e4a')}
      ${makeMultilineSvgText(member.message, FIELDS.message, '#1a2e4a')}
    </svg>`

    compositeOps.push({
      input: Buffer.from(svgOverlay),
      top: 0,
      left: 0,
    })

    // Handle photo upload
    if (photoFile && photoFile.size > 0) {
      const photoBuffer = Buffer.from(await photoFile.arrayBuffer())
      const { x, y, w, h } = FIELDS.photo

      // Resize & fit photo into photo area
      const resizedPhoto = await sharp(photoBuffer)
        .resize(w, h, { fit: 'cover', position: 'top' })
        .toBuffer()

      compositeOps.push({
        input: resizedPhoto,
        top: y,
        left: x,
      })
    }

    // Compose final image
    const outputBuffer = await sharp(templatePath)
      .resize(W, H)
      .composite(compositeOps)
      .png({ quality: 90, compressionLevel: 6 })
      .toBuffer()

    return new Response(outputBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="HQ_Welcome_${member.name.replace(/\s+/g, '_')}.png"`,
      },
    })
  } catch (error) {
    console.error('Generate image error:', error)
    return Response.json({ error: error.message || 'Lỗi tạo ảnh' }, { status: 500 })
  }
}

export const maxDuration = 30
