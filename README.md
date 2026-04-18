# HQ Group — Onboarding Bot

Web app tạo bài viết và ảnh chào đón nhân sự mới, chạy trên Vercel.

## Tính năng
- ✅ Nhập thông tin nhiều nhân viên mới
- ✅ 4 phong cách bài viết (Vui vẻ / Trang trọng / Năng lượng / Sáng tạo)
- ✅ AI tự động viết bài Telegram bằng Claude
- ✅ Tạo ảnh welcome card từ template PSD gốc
- ✅ Copy bài viết và tải ảnh xuống

---

## Cài đặt local

### 1. Clone và cài dependencies
```bash
npm install
```

### 2. Tạo file `.env.local`
```bash
cp .env.example .env.local
```
Mở `.env.local` và điền API key của bạn:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

### 3. Chạy dev server
```bash
npm run dev
```
Truy cập: http://localhost:3000

---

## Deploy lên Vercel

### Cách 1: Qua Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Cách 2: Qua GitHub
1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → Import project
3. Chọn repo → Deploy

### Cấu hình Environment Variables trên Vercel
Sau khi import project, vào **Settings → Environment Variables**:
```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxx
```

---

## Cấu trúc project
```
hq-onboarding/
├── public/
│   ├── template_clean.png     # Template welcome card (không có ảnh người)
│   └── template_full.png      # Template đầy đủ (để reference)
├── src/app/
│   ├── api/
│   │   ├── generate-post/     # API tạo bài viết với Claude
│   │   │   └── route.js
│   │   └── generate-image/    # API tạo ảnh welcome card với sharp
│   │       └── route.js
│   ├── globals.css
│   ├── layout.js
│   ├── page.js                # Main UI
│   └── page.module.css
├── .env.example
├── next.config.js
├── package.json
└── vercel.json
```

## Ghi chú
- **Ảnh welcome card** chỉ hỗ trợ 1 người mỗi lần (do template chỉ có 1 khung ảnh)
- Nên dùng ảnh người **đã xóa nền** (PNG transparent) để kết quả đẹp hơn
- File template `template_clean.png` được export từ file PSD gốc của HQ Group
