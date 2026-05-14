"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Eye, RotateCcw, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WordCard, WordSession, WordSessionSubmitResult } from "@/lib/words/queries";
import type { WordSessionAnswer } from "@/lib/words/validation";

type RecallItem = {
  word: WordCard;
  repeat: boolean;
};

type TrainerStage = "intro" | "recall" | "complete";

export function FlashcardTrainer({ session }: { session: WordSession }) {
  const [stage, setStage] = useState<TrainerStage>("intro");
  const [introIndex, setIntroIndex] = useState(0);
  const [recallQueue, setRecallQueue] = useState<RecallItem[]>([]);
  const [recallIndex, setRecallIndex] = useState(0);
  const [answerShown, setAnswerShown] = useState(false);
  const [markedDifficultIds, setMarkedDifficultIds] = useState<Set<string>>(() => new Set());
  const [answers, setAnswers] = useState<WordSessionAnswer[]>([]);
  const [summary, setSummary] = useState<WordSessionSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCards = session.words.length;
  const currentIntroWord = session.words[introIndex];
  const currentRecallItem = recallQueue[recallIndex];
  const currentRecallWord = currentRecallItem?.word;
  const progressLabel = stage === "intro" ? `${Math.min(introIndex + 1, totalCards)} / ${totalCards}` : `${Math.min(recallIndex + 1, recallQueue.length)} / ${recallQueue.length}`;
  const sideLabel = stage === "intro" ? "ответ" : answerShown ? "ответ" : "слово";

  const repeatedUnknownIds = useMemo(() => new Set(recallQueue.filter((item) => item.repeat).map((item) => item.word.id)), [recallQueue]);

  function moveIntro(word: WordCard, markedDifficult: boolean) {
    setRecallQueue((current) => [...current, { word, repeat: false }]);
    if (markedDifficult) {
      setMarkedDifficultIds((current) => new Set(current).add(word.id));
    }

    const nextIndex = introIndex + 1;
    if (nextIndex >= session.words.length) {
      setStage("recall");
      setRecallIndex(0);
      setAnswerShown(false);
    } else {
      setIntroIndex(nextIndex);
    }
  }

  function submitAnswers(nextAnswers: WordSessionAnswer[]) {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/words/sessions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: nextAnswers })
      });

      if (!response.ok) {
        setError("Не удалось сохранить результат тренировки. Попробуйте ещё раз.");
        return;
      }

      setSummary((await response.json()) as WordSessionSubmitResult);
      setStage("complete");
    });
  }

  function answerRecall(result: WordSessionAnswer["result"]) {
    if (!currentRecallWord) return;

    const nextAnswer: WordSessionAnswer = {
      wordId: currentRecallWord.id,
      result,
      markedDifficult: markedDifficultIds.has(currentRecallWord.id)
    };
    const nextAnswers = [...answers, nextAnswer];
    setAnswers(nextAnswers);

    const willRepeat = result === "unknown" && !currentRecallItem.repeat && !repeatedUnknownIds.has(currentRecallWord.id);
    if (willRepeat) {
      setRecallQueue((current) => [...current, { word: currentRecallWord, repeat: true }]);
    }

    const nextIndex = recallIndex + 1;
    if (nextIndex >= recallQueue.length && !willRepeat) {
      submitAnswers(nextAnswers);
      return;
    }

    setRecallIndex(nextIndex);
    setAnswerShown(false);
  }

  if (stage === "complete" && summary) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <TrainerHeader title="Тренировка завершена" progress="Готово" side="результат" />
        <Card className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
          <CardContent className="space-y-6 p-6">
            <div>
              <p className="text-sm font-bold text-[#1f7aff]">{session.topicTitle}</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Результат тренировки</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ResultStat label="Всего слов" value={summary.totalWords} />
              <ResultStat label="Знал" value={summary.knownCount} />
              <ResultStat label="Вспомнил с трудом" value={summary.hardCount} />
              <ResultStat label="Не знал" value={summary.unknownCount} />
              <ResultStat label="Добавлено в сложные" value={summary.addedDifficultCount} />
              <ResultStat label="Стало выученными" value={summary.masteredCount} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/words/train?mode=difficult&limit=10" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white">
                Повторить сложные
                <RotateCcw className="h-4 w-4" />
              </Link>
              <Link href="/words/train?mode=new&limit=5" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dde2e9] px-4 py-2 text-sm font-black text-slate-700">
                Изучить ещё слова
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/words/my" className="inline-flex min-h-11 items-center rounded-xl border border-[#dde2e9] px-4 py-2 text-sm font-black text-slate-700">
                Вернуться в карточки
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "intro" && currentIntroWord) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <TrainerHeader title={session.topicTitle} progress={progressLabel} side={sideLabel} />
        <FlashcardFrame word={currentIntroWord} eyebrow="Знакомство">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button className="min-h-12 rounded-xl bg-[#1f7aff] font-black text-white hover:bg-[#1669db]" onClick={() => moveIntro(currentIntroWord, false)}>
              <Check className="mr-2 h-4 w-4" />
              Понятно
            </Button>
            <Button className="min-h-12 rounded-xl border-amber-200 bg-amber-50 font-black text-amber-800 hover:bg-amber-100" variant="outline" onClick={() => moveIntro(currentIntroWord, true)}>
              <BrainIcon />
              Сложное слово
            </Button>
          </div>
        </FlashcardFrame>
      </div>
    );
  }

  if (stage === "recall" && currentRecallWord) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <TrainerHeader title={session.topicTitle} progress={progressLabel} side={sideLabel} />
        <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-8 p-6 sm:p-8">
            <div className="space-y-2 text-center">
              <p className="text-sm font-bold uppercase text-[#1f7aff]">Проверка вспоминания</p>
              <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">{currentRecallWord.term}</h1>
              <p className="text-sm font-semibold text-slate-500">{currentRecallWord.topicTitle}</p>
            </div>

            {answerShown ? (
              <div className="space-y-5 rounded-2xl bg-[#f8fbff] p-5">
                <div>
                  <p className="text-sm font-bold uppercase text-slate-500">Перевод</p>
                  <p className="text-2xl font-black text-slate-900">{currentRecallWord.translation}</p>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase text-slate-500">Example</p>
                  <p className="text-lg font-semibold text-slate-800">{currentRecallWord.example}</p>
                  <p className="text-base text-slate-600">{currentRecallWord.exampleTranslation}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Button disabled={isPending} className="min-h-12 rounded-xl bg-emerald-600 font-black text-white hover:bg-emerald-700" onClick={() => answerRecall("known")}>
                    Знал
                  </Button>
                  <Button disabled={isPending} className="min-h-12 rounded-xl bg-amber-500 font-black text-white hover:bg-amber-600" onClick={() => answerRecall("hard")}>
                    Вспомнил с трудом
                  </Button>
                  <Button disabled={isPending} className="min-h-12 rounded-xl bg-rose-600 font-black text-white hover:bg-rose-700" onClick={() => answerRecall("unknown")}>
                    Не знал
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-base text-slate-500">Попробуйте вспомнить перевод самостоятельно.</p>
                <Button className="min-h-12 rounded-xl bg-slate-900 px-6 font-black text-white hover:bg-slate-700" onClick={() => setAnswerShown(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Показать ответ
                </Button>
              </div>
            )}
            {error ? <p className="text-center text-sm font-semibold text-rose-600">{error}</p> : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

function TrainerHeader({ title, progress, side }: { title: string; progress: string; side: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-[#1f7aff]">{title}</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Карточка {progress}</h1>
        <p className="text-sm text-slate-500">Сторона: {side}</p>
      </div>
      <Link href="/words/my" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dde2e9] px-4 py-2 text-sm font-black text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Выйти
      </Link>
    </div>
  );
}

function FlashcardFrame({ word, eyebrow, children }: { word: WordCard; eyebrow: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardContent className="space-y-8 p-6 sm:p-8">
        <div className="space-y-5 text-center">
          <p className="text-sm font-bold uppercase text-[#1f7aff]">{eyebrow}</p>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">{word.term}</h1>
          <p className="text-3xl font-black text-slate-700">{word.translation}</p>
        </div>
        <div className="space-y-3 rounded-2xl bg-[#f8fbff] p-5">
          <p className="text-sm font-bold uppercase text-slate-500">Example</p>
          <p className="text-lg font-semibold text-slate-800">{word.example}</p>
          <p className="text-base text-slate-600">{word.exampleTranslation}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function ResultStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#dde2e9] bg-[#f8fbff] p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function BrainIcon() {
  return <X className="mr-2 h-4 w-4" />;
}
