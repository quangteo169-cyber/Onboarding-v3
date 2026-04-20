import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const TEMPLATE = path.join(process.cwd(), 'public', 'teamplate_clean.jpg')

// Chỉ phủ đúng phần khung đen, chừa lại bóng xám phía sau
const PHOTO_BOX = {
  x: 839,
  y: 155,
  w: 404,
  h: 566,
  rx: 52,
}

async function makeRoundedPhoto(photoBuffer, box) {
  const { w, h, rx } = box

  const mask = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" ry="${rx}" fill="white"/>
    </svg>
  `)

  return await sharp(photoBuffer)
    .resize(w, h, {
      fit: 'cover',
      position: 'centre',
    })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const photoFile = formData.get('photo')

    if (!fs.existsSync(TEMPLATE)) {
      return Response.json(
        { error: 'Không tìm thấy file teamplate_clean.jpg' },
        { status: 500 }
      )
    }

    const composites = []

    if (photoFile && photoFile.size > 0) {
      const photoBuffer = Buffer.from(await photoFile.arrayBuffer())
      const roundedPhoto = await makeRoundedPhoto(photoBuffer, PHOTO_BOX)

      composites.push({
        input: roundedPhoto,
        top: PHOTO_BOX.y,
        left: PHOTO_BOX.x,
      })
    }

    const outputBuffer = await sharp(TEMPLATE)
      .composite(composites)
      .png()
      .toBuffer()

    return new Response(outputBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="HQ_Welcome_Card.png"',
      },
    })
  } catch (error) {
    console.error('Generate image error:', error)
    return Response.json(
      { error: error.message || 'Lỗi tạo ảnh' },
      { status: 500 }
    )
  }
}

export const maxDuration = 30
