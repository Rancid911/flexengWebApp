import type { Metadata } from "next";

import { MarketingHomePage } from "@/features/marketing/components/marketing-home-page";

export const metadata: Metadata = {
  title: "Школа английского языка онлайн - изучение английского языка в удобной учебной среде",
  description: "Флексенг помогает уверенно говорить на английском через персональные программы, сильных преподавателей и понятный трек прогресса.",
  openGraph: {
    title: "Школа английского языка онлайн - изучение английского языка в удобной учебной среде",
    description: "Онлайн-школа с персональной программой, сильными преподавателями и измеримым прогрессом.",
    type: "website",
    locale: "ru_RU"
  }
};

export default function MainPage() {
  return <MarketingHomePage />;
}
