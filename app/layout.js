import "./globals.css";

export const metadata = {
  title: "Kabut. — Chat Anonim Tanpa Jejak",
  description: "Ngobrol rahasia paling aman di Nusantara. Tanpa database, tanpa riwayat, murni privasi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
