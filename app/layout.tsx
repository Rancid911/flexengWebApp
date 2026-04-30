import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Школа английского языка онлайн - изучение английского языка в удобной учебной среде",
  description: "Изучение английского языка в удобной учебной среде"
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-background text-foreground antialiased [color-scheme:light]">
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[100] rounded-full bg-[#1f1a36] px-4 py-2 text-sm font-medium text-white shadow-lg transition-[opacity,transform] focus:not-sr-only focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2"
        >
          Перейти к основному содержимому
        </a>
        {children}
      </body>
    </html>
  );
}
