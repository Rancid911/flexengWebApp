import type { Metadata } from "next";

import { TrialLessonPage } from "@/features/marketing/landing-pages/trial-lesson/trial-lesson-page";

export const metadata: Metadata = {
  title: "Записаться на бесплатный вводный урок",
  description: "Оставьте заявку на бесплатный вводный урок английского языка"
};

export default function TrialLessonRoute() {
  return <TrialLessonPage />;
}
