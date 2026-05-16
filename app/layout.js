import './globals.css'

export const metadata = {
  title: 'AnonChat — Ngobrol Anonim',
  description: 'Chat anonim tanpa akun. Buat room, bagikan kode, ngobrol.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
