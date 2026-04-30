"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PracticeTestActivityDetail } from "@/lib/practice/queries";
import { PracticeTestRunner, beginPlacementTest } from "./practice-test-runner";

type Props = {
  payload: PracticeTestActivityDetail;
};

const placementRules = [
  "На выполнение теста отводится до 30 минут.",
  "Вопросы идут от более простых к более сложным.",
  "В каждом вопросе нужно выбрать один правильный вариант ответа.",
  "Когда время закончится, продолжить ответы будет нельзя.",
  "После отправки результат будет доступен преподавателю."
];

const placementHowItWorks = [
  "Тест состоит из коротких диалогов с выбором ответа A–D.",
  "Пока время не истекло, можно переключаться между вопросами.",
  "Таймер запускается только после нажатия кнопки «Начать тест»."
];

export function PlacementTestFlow({ payload }: Props) {
  const [started, setStarted] = useState(false);

  if (started) {
    return <PracticeTestRunner payload={payload} placementStarted />;
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border-[#e8dcff] bg-[linear-gradient(160deg,#ffffff_0%,#faf7ff_55%,#f5f3ff_100%)] shadow-[0_18px_44px_rgba(91,33,182,0.10)]">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border-0 bg-[#7c3aed] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)]">
                Placement test
              </Badge>
              <Badge variant="secondary" className="rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#6d28d9]">
                {payload.timeLimitMinutes ? `${payload.timeLimitMinutes} минут` : "Без лимита"}
              </Badge>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-[-0.05em] text-slate-900 sm:text-4xl">Подготовка к placement test</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Это диагностический тест уровня. Он помогает преподавателю понять ваш текущий уровень английского и подобрать дальнейший маршрут обучения.
              </p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#eadcff] bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7c3aed]">Формат</p>
            <p className="mt-1 font-semibold text-slate-900">Диалоги с выбором ответа A–D</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-[1.75rem] border border-[#eadcff] bg-white/80 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#7c3aed]">Правила</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {placementRules.map((rule) => (
                <li key={rule} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#7c3aed]" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.75rem] border border-[#dfe9fb] bg-white/85 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">Как проходит тест</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {placementHowItWorks.map((item) => (
                <p key={item} className="rounded-[1.1rem] bg-slate-50 px-4 py-3">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[#eadcff] bg-white/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-600">
            После нажатия <span className="font-black text-slate-900">«Начать тест»</span> откроются вопросы и сразу запустится обратный отсчёт.
          </p>
          <Button
            type="button"
            className="h-11 rounded-2xl bg-[#7c3aed] px-5 font-black text-white hover:bg-[#6d28d9]"
            onClick={() => {
              beginPlacementTest(payload.id);
              setStarted(true);
            }}
          >
            Начать тест
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
