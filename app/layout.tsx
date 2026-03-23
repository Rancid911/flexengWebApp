import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Школа английского языка онлайн - изучение английского языка в удобной учебной среде",
  description: "Изучение английского языка в удобной учебной среде"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
