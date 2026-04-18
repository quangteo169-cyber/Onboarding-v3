import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const STYLE_MAP = {
  friendly: 'vui vẻ, thân thiện, dùng nhiều emoji phù hợp, ngôn ngữ gần gũi như người trong gia đình',
  formal: 'trang trọng, chuyên nghiệp, lịch sự, dùng ít emoji, ngôn ngữ cẩn thận',
  energetic: 'năng lượng, hào hứng, nhiệt huyết cao, dùng emoji mạnh mẽ như 🔥⚡🚀💥',
  creative: 'sáng tạo, độc đáo, dùng ẩn dụ hoặc hình ảnh thú vị, tạo sự bất ngờ dễ chịu',
}

const SAMPLE_POSTS = `
MẪU 1 (nhiều người, trang trọng):
🎉 CHÀO ĐÓN THÀNH VIÊN MỚI GIA NHẬP ĐẠI GIA ĐÌNH HQ GROUP 🎉
Tại HQ Group, chúng tôi luôn trân trọng những tài năng, những con người đầy hoài bão và nhiệt huyết. Hôm nay, chúng tôi vinh dự chào đón những tân binh đầy triển vọng:
💠 Tên - Chức vụ - Phòng ban
❤️ Chúng tôi tin rằng với năng lượng trẻ trung, sự tài năng và nhiệt huyết của các bạn, hành trình sắp tới chúng ta sẽ cùng nhau viết nên những trang mới đầy cảm hứng.

MẪU 2 (1 người, thân thiện):
🎊 CHÀO MỪNG THÀNH VIÊN MỚI ĐẾN VỚI HQ GROUP 🎊
👋 HQ Group vui mừng chào đón Bạn [Tên] chính thức gia nhập đội ngũ với vị trí [Chức vụ].
Mong rằng trong thời gian tại HQ Group, bạn sẽ có cơ hội học hỏi, phát triển bản thân và đóng góp vào sự phát triển chung. Chào mừng bạn đến với HQ Group!

MẪU 3 (1 người, năng lượng):
🎉 CHÀO MỪNG "TÂN BINH" MỚI NHÀ HQ GROUP 🎉
🔥 Hãy cùng nhau chào mừng một "chiến binh" siêu nhiệt huyết vừa gia nhập đội hình HQ Group!
[Tên] - [Chức vụ] - [Phòng ban]
😄 Chúng mình rất vui vì bạn đã chọn đồng hành cùng HQ Group!
`

export async function POST(request) {
  try {
    const body = await request.json()
    const { members, style, postType, regenerate } = body

    if (!members || members.length === 0) {
      return Response.json({ error: 'Thiếu thông tin nhân viên' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 })
    }

    const client = new GoogleGenerativeAI(apiKey)
   const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const memberList = members
      .map((m) => `- Tên: ${m.name}, Chức vụ: ${m.position}, Phòng ban: ${m.dept}`)
      .join('\n')

    const prompt = `Bạn là HR của công ty HQ Group. Hãy viết một bài đăng Telegram chào mừng nhân sự mới.

THÔNG TIN NHÂN VIÊN MỚI:
${memberList}

CÁC MẪU BÀI VIẾT THAM KHẢO:
${SAMPLE_POSTS}

YÊU CẦU:
- Phong cách: ${STYLE_MAP[style] || STYLE_MAP.friendly}
- Bài viết ${postType === 'single' ? 'cho 1 người cụ thể' : 'cho nhiều người cùng lúc (dạng danh sách)'}
- Bắt đầu bằng tiêu đề có emoji
- Viết hoàn toàn bằng tiếng Việt
- Liệt kê tên nhân viên rõ ràng theo format: Tên - Chức vụ - Phòng ban
- Có lời chúc và lời kết ấm áp
- Độ dài vừa phải, phù hợp đọc trên Telegram (không quá dài)
- KHÔNG dùng markdown header (#), KHÔNG dùng **bold**, chỉ dùng text thuần và emoji
- Tên công ty luôn là: HQ Group
${regenerate ? '- Hãy viết một phiên bản HOÀN TOÀN KHÁC, sáng tạo và độc đáo hơn các mẫu tham khảo' : ''}

Chỉ trả về nội dung bài đăng, không giải thích thêm.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return Response.json({ content: text })
  } catch (error) {
    console.error('Generate post error:', error)
    return Response.json({ error: error.message || 'Lỗi server' }, { status: 500 })
  }
}
