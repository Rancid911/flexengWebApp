"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusMessage } from "@/components/ui/status-message";
import type { PracticeQuestion, PracticeTestActivityDetail } from "@/lib/practice/queries";
import type { PracticeAttemptResult } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

type ActivityTone = string;

export function UnsupportedPracticeActivity({ payload, badgeTone, metaText }: { payload: PracticeTestActivityDetail; badgeTone: ActivityTone; metaText: string }) {
  return (
    <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className={cn("rounded-full border-0 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em]", badgeTone)}>
            {payload.activityType === "trainer" ? "Тренажёр" : "Тест"}
          </Badge>
          <p className="text-sm font-semibold text-slate-500">{metaText || payload.meta}</p>
        </div>
        <StatusMessage tone="warning">
          В этом материале есть неподдерживаемые типы вопросов: {payload.unsupportedQuestionTypes.join(", ")}. Для v1 доступны только single choice вопросы.
        </StatusMessage>
      </CardContent>
    </Card>
  );
}

export function PracticeDetailedReport({ detailResult, sectionHref, onReturnToSection, onRetry }: { detailResult: PracticeAttemptResult; sectionHref: string | null; onReturnToSection: () => void; onRetry: () => void }) {
  const isPlacementResult = detailResult.assessmentKind === "placement";

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant={detailResult.passed ? "success" : "warning"} className={cn("rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide", detailResult.passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                {detailResult.passed ? "Пройден" : "Не пройден"}
              </Badge>
              <div>
                <p className="text-4xl font-black tracking-[-0.04em] text-slate-900">{detailResult.score}%</p>
                {isPlacementResult ? (
                  <div className="space-y-1 text-sm text-slate-500">
                    <p>
                      {detailResult.correctAnswers} из {detailResult.totalQuestions} правильных ответов.
                    </p>
                    {detailResult.recommendedLevel ? <p className="font-bold text-slate-700">Рекомендованный уровень: {detailResult.recommendedLevel}</p> : null}
                    {detailResult.recommendedBandLabel ? <p>{detailResult.recommendedBandLabel}</p> : null}
                    <p>Результат отправлен преподавателю.</p>
                    <p>Преподаватель использует его для рекомендации уровня.</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    {detailResult.correctAnswers} из {detailResult.totalQuestions} правильных ответов. Проходной балл: {detailResult.passingScore}%.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              {sectionHref ? (
                <Button type="button" variant="outline" onClick={onReturnToSection} className="rounded-2xl border-[#dde2e9] px-5 font-bold">
                  Вернуться в раздел
                </Button>
              ) : null}
              <Button type="button" onClick={onRetry} className="rounded-2xl bg-slate-900 px-5 font-bold text-white hover:bg-slate-800">
                Пройти ещё раз
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {detailResult.questions.map((question, index) => (
          <Card key={question.questionId} className="rounded-[1.75rem] border-[#dde2e9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Вопрос {index + 1}</p>
                <Badge variant={question.isCorrect ? "success" : "warning"} className={cn("rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide", question.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
                  {question.isCorrect ? "Верно" : "Ошибка"}
                </Badge>
              </div>
              <p className="text-lg font-bold text-slate-900">{question.prompt}</p>
              <div className="space-y-2 rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Ваш ответ:</span> {question.selectedOptionText ?? "Не выбран"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Правильный ответ:</span> {question.correctOptionText ?? "Не указан"}
                </p>
                {question.explanation ? (
                  <p>
                    <span className="font-semibold text-slate-900">Пояснение:</span> {question.explanation}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

type PracticeResultPopupProps = {
  popupResult: PracticeAttemptResult | null;
  isPlacement: boolean;
  placementResultPending: boolean;
  submitError: string | null;
  sectionHref: string | null;
  canOpenDetailedReport: boolean;
  hasSavedResult: boolean;
  onRetry: () => void;
  onReturnToSection: () => void;
  onOpenDetailedReport: () => void;
};

export function PracticeResultPopup({ popupResult, isPlacement, placementResultPending, submitError, sectionHref, canOpenDetailedReport, hasSavedResult, onRetry, onReturnToSection, onOpenDetailedReport }: PracticeResultPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <Card className="w-full max-w-xl rounded-[2rem] border-white/70 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]" data-testid="practice-result-popup">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-3">
            <Badge variant={popupResult?.passed ? "success" : "warning"} className={cn("rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide", placementResultPending ? "bg-indigo-50 text-indigo-700" : popupResult?.passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
              {placementResultPending ? "Проверяем" : popupResult?.passed ? "Пройден" : "Есть ошибки"}
            </Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{isPlacement ? "Тест завершён" : "Результат готов"}</h2>
              {placementResultPending ? (
                <p className="text-sm font-semibold text-slate-500">Проверяем ответы и рассчитываем уровень...</p>
              ) : popupResult ? (
                <div className="space-y-2">
                  <p className="text-5xl font-black tracking-[-0.05em] text-slate-900">{popupResult.score}%</p>
                  <p className="text-sm font-semibold text-slate-600">
                    {popupResult.correctAnswers} из {popupResult.totalQuestions} правильных ответов.
                  </p>
                  {isPlacement && popupResult.recommendedLevel ? (
                    <div className="rounded-[1.25rem] bg-indigo-50 p-4 text-sm text-slate-700">
                      <p className="font-black text-slate-900">Рекомендованный уровень: {popupResult.recommendedLevel}</p>
                      {popupResult.recommendedBandLabel ? <p>{popupResult.recommendedBandLabel}</p> : null}
                    </div>
                  ) : !isPlacement ? (
                    <p className="text-sm text-slate-500">Проходной балл: {popupResult.passingScore}%.</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-500">Сохраняем результат...</p>
              )}
            </div>
          </div>

          {submitError ? <StatusMessage>{isPlacement ? `Не удалось сохранить и проверить результат. ${submitError}` : submitError}</StatusMessage> : null}

          <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <Button type="button" variant="outline" className="w-full rounded-2xl border-[#dde2e9] px-5 font-bold" onClick={onRetry}>
              Пройти ещё раз
            </Button>
            {sectionHref ? (
              <Button type="button" variant="outline" className="w-full rounded-2xl border-[#dde2e9] px-5 font-bold" onClick={onReturnToSection}>
                Вернуться в раздел
              </Button>
            ) : (
              <span aria-hidden />
            )}
            <Button type="button" className="w-full rounded-2xl bg-slate-900 px-5 font-bold text-white hover:bg-slate-800" onClick={onOpenDetailedReport} disabled={!canOpenDetailedReport}>
              {isPlacement && !hasSavedResult ? "Готовим детали..." : "Посмотреть детали"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type PracticeRunnerHeaderProps = {
  payload: PracticeTestActivityDetail;
  badgeTone: ActivityTone;
  metaText: string;
  isPlacementWithTimer: boolean;
  timerExpired: boolean;
  remainingSeconds: number | null;
  currentIndex: number;
  totalQuestions: number;
  formatCountdown: (seconds: number) => string;
};

export function PracticeRunnerHeader({ payload, badgeTone, metaText, isPlacementWithTimer, timerExpired, remainingSeconds, currentIndex, totalQuestions, formatCountdown }: PracticeRunnerHeaderProps) {
  return (
    <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={cn("rounded-full border-0 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em]", badgeTone)}>
                {payload.activityType === "trainer" ? "Тренажёр" : "Тест"}
              </Badge>
              {payload.assessmentKind === "placement" ? (
                <Badge variant="secondary" className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">Placement test</Badge>
              ) : payload.cefrLevel ? (
                <Badge variant="secondary" className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">{payload.cefrLevel}</Badge>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-slate-500">{metaText || payload.meta}</p>
          </div>
          <div className="min-w-48 space-y-2">
            {isPlacementWithTimer ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
                <span>{timerExpired ? "Время вышло" : "Осталось"}</span>
                <span data-testid="placement-countdown">{formatCountdown(remainingSeconds ?? 0)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
              <span>
                Вопрос {currentIndex + 1} из {totalQuestions}
              </span>
              <span>{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
            </div>
            <Progress value={((currentIndex + 1) / totalQuestions) * 100} className="h-2 rounded-full bg-slate-100 [&>div]:bg-indigo-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PracticeQuestionNavigator({ questions, answers, currentIndex, timerExpired, onSelectQuestion }: { questions: PracticeQuestion[]; answers: Record<string, string>; currentIndex: number; timerExpired: boolean; onSelectQuestion: (index: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question, index) => {
        const answered = Boolean(answers[question.id]);
        const current = index === currentIndex;
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onSelectQuestion(index)}
            className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition-colors", current ? "border-indigo-300 bg-indigo-50 text-indigo-700" : answered ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#dde2e9] bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900")}
            aria-label={`Вопрос ${index + 1}`}
            disabled={timerExpired}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}

type PracticeQuestionCardProps = {
  currentQuestion: PracticeQuestion | null;
  displayQuestions: PracticeQuestion[];
  answers: Record<string, string>;
  answeredCount: number;
  timerExpired: boolean;
  submitting: boolean;
  submitError: string | null;
  shouldAutoAdvanceOnSelect: boolean;
  canSubmit: boolean;
  isPlacement: boolean;
  isActivePlacementAttempt: boolean;
  onAnswer: (optionId: string) => void;
  onRetry: () => void;
  onSubmit: () => void;
  onExit: () => void;
};

export function PracticeQuestionCard({ currentQuestion, displayQuestions, answers, answeredCount, timerExpired, submitting, submitError, shouldAutoAdvanceOnSelect, canSubmit, isPlacement, isActivePlacementAttempt, onAnswer, onRetry, onSubmit, onExit }: PracticeQuestionCardProps) {
  return (
    <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-6 p-6">
        {currentQuestion ? (
          <>
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Текущий вопрос</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{currentQuestion.prompt}</h2>
              {currentQuestion.explanation ? <p className="text-sm text-slate-500">{currentQuestion.explanation}</p> : null}
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const checked = answers[currentQuestion.id] === option.id;
                const isInteractiveOption = !checked && shouldAutoAdvanceOnSelect;
                return (
                  <label key={option.id} data-testid={`practice-option-card-${index + 1}`} className={cn("flex items-start gap-4 rounded-[1.5rem] border px-4 py-4 transition-[background-color,border-color,box-shadow,transform] duration-200", timerExpired || submitting ? "cursor-default" : "cursor-pointer", checked ? "border-indigo-300 bg-indigo-50" : "group border-[#dde2e9] bg-white", isInteractiveOption ? "hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/60 hover:shadow-[0_12px_28px_rgba(79,70,229,0.12)]" : null)}>
                    <input type="radio" name={currentQuestion.id} checked={checked} disabled={timerExpired || submitting} onChange={() => onAnswer(option.id)} className={cn("mt-1 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500", isInteractiveOption ? "group-hover:border-indigo-300" : null)} data-testid={`practice-option-${index + 1}`} />
                    <div>
                      <p className={cn("text-base font-semibold text-slate-900", isInteractiveOption ? "group-hover:text-slate-950" : null)}>{option.optionText}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {submitError ? <StatusMessage>{submitError}</StatusMessage> : null}
            {timerExpired ? <StatusMessage>Время вышло. Ответы зафиксированы, продолжить тест нельзя.</StatusMessage> : null}

            <div className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <p className="text-sm text-slate-500">
                Отвечено {answeredCount} из {displayQuestions.length}
              </p>
              <div className="flex flex-wrap justify-center gap-3 md:col-start-2">
                {isPlacement && !timerExpired ? (
                  <Button type="button" size="lg" className="rounded-2xl bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700" onClick={onSubmit} disabled={!canSubmit} data-testid="practice-submit">
                    {submitting ? "Сохранение..." : "Завершить"}
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap justify-start gap-3 md:justify-end">
                {timerExpired ? (
                  <>
                    <Button type="button" variant="outline" size="lg" className="rounded-2xl border-[#dde2e9] px-5" onClick={onRetry} disabled={submitting}>
                      Пройти заново
                    </Button>
                    <Button type="button" size="lg" className="rounded-2xl bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700" onClick={onSubmit} disabled={!canSubmit} data-testid="practice-submit">
                      {submitting ? "Сохранение..." : "Отправить результат"}
                    </Button>
                  </>
                ) : null}
                {isActivePlacementAttempt ? (
                  <Button type="button" variant="outline" size="lg" className="min-w-36 rounded-2xl border-rose-200 px-7 font-black text-rose-700 hover:bg-rose-50 hover:text-rose-800" onClick={onExit}>
                    Выйти
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
