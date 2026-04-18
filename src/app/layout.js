import './globals.css'

export const metadata = {
  title: 'HQ Group — Onboarding Bot',
  description: 'Tạo bài viết và ảnh chào đón nhân sự mới HQ Group',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
