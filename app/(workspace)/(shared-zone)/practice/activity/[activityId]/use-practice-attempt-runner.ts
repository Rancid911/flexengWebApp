"use client";

import { useMemo, useRef, useState, type RefObject } from "react";

import { clearPlacementProgress } from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/use-placement-test-timer";
import type { PracticeQuestion, PracticeTestActivityDetail } from "@/lib/practice/queries";
import type { PracticeAttemptResult } from "@/lib/practice/types";

function shuffleOptions(options: PracticeQuestion["options"]) {
  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
  }
  return shuffled;
}

function buildDisplayQuestions(payload: PracticeTestActivityDetail) {
  if (payload.assessmentKind === "placement") return payload.content;
  return payload.content.map((question) => ({
    ...question,
    options: shuffleOptions(question.options)
  }));
}

function buildLocalAttemptResult(payload: PracticeTestActivityDetail, questionsSource: PracticeQuestion[], selectedAnswers: Record<string, string>): PracticeAttemptResult {
  const questions = questionsSource.map((question) => {
    const selectedOptionId = selectedAnswers[question.id] ?? null;
    const selectedOption = question.options.find((option) => option.id === selectedOptionId) ?? null;
    const correctOption = question.options.find((option) => option.isCorrect) ?? null;

    return {
      questionId: question.id,
      prompt: question.prompt,
      explanation: question.explanation,
      selectedOptionId,
      selectedOptionText: selectedOption?.optionText ?? null,
      correctOptionId: correctOption?.id ?? null,
      correctOptionText: correctOption?.optionText ?? null,
      isCorrect: Boolean(selectedOption && correctOption && selectedOption.id === correctOption.id),
      placementBand: question.placementBand
    };
  });
  const correctAnswers = questions.filter((question) => question.isCorrect).length;
  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return {
    attemptId: "local-preview",
    score,
    correctAnswers,
    totalQuestions,
    passed: score >= payload.passingScore,
    passingScore: payload.passingScore,
    assessmentKind: "regular",
    questions
  };
}

type UsePracticeAttemptRunnerArgs = {
  allowNavigationRef: RefObject<boolean>;
  payload: PracticeTestActivityDetail;
  resetPlacementTimer: () => void;
  startedAtRef: RefObject<number>;
  stopPlacementTimer: () => void;
  timerExpired: boolean;
};

export function usePracticeAttemptRunner({
  allowNavigationRef,
  payload,
  resetPlacementTimer,
  startedAtRef,
  stopPlacementTimer,
  timerExpired
}: UsePracticeAttemptRunnerArgs) {
  const [displayQuestions] = useState(() => buildDisplayQuestions(payload));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PracticeAttemptResult | null>(null);
  const [localReviewResult, setLocalReviewResult] = useState<PracticeAttemptResult | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [placementResultPending, setPlacementResultPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);
  const submitRunIdRef = useRef(0);

  const currentQuestion = displayQuestions[currentIndex] ?? null;
  const isPlacement = payload.assessmentKind === "placement";
  const shouldAutoAdvanceOnSelect = !timerExpired && !submitting;
  const answeredCount = useMemo(() => displayQuestions.filter((question) => Boolean(answers[question.id])).length, [answers, displayQuestions]);
  const canSubmit = displayQuestions.length > 0 && !submitting && (timerExpired ? answeredCount > 0 : answeredCount === displayQuestions.length);

  async function handleSubmit(overrideAnswers?: Record<string, string>) {
    if (submitInFlightRef.current) return;
    const answersToSubmit = overrideAnswers ?? answers;
    const answeredQuestions = displayQuestions.filter((question) => Boolean(answersToSubmit[question.id])).length;
    const canSubmitNow = displayQuestions.length > 0 && !submitting && (timerExpired ? answeredQuestions > 0 : answeredQuestions === displayQuestions.length);

    if (!canSubmitNow) return;

    submitInFlightRef.current = true;
    const submitRunId = submitRunIdRef.current + 1;
    submitRunIdRef.current = submitRunId;
    setSubmitting(true);
    setSubmitError(null);
    if (payload.assessmentKind === "placement") {
      setShowResultPopup(true);
      setShowDetailedReport(false);
      setPlacementResultPending(true);
    }
    try {
      const response = await fetch("/api/practice/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: payload.id,
          answers: displayQuestions
            .map((question) => ({
              questionId: question.id,
              optionId: answersToSubmit[question.id]
            }))
            .filter((answer) => Boolean(answer.optionId)),
          allowPartial: timerExpired && payload.assessmentKind === "placement",
          timeSpentSeconds: Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
        })
      });

      const data = (await response.json()) as PracticeAttemptResult | { message?: string };
      if (!response.ok) {
        throw new Error("message" in data && typeof data.message === "string" ? data.message : "Не удалось сохранить результат");
      }

      if (submitRunIdRef.current !== submitRunId) return;
      clearPlacementProgress(payload.id);
      stopPlacementTimer();
      allowNavigationRef.current = true;
      const nextResult = data as PracticeAttemptResult;
      setResult(nextResult);
      setPlacementResultPending(false);
      if (payload.assessmentKind === "placement") {
        setShowResultPopup(true);
      }
    } catch (error) {
      if (submitRunIdRef.current !== submitRunId) return;
      setPlacementResultPending(false);
      setSubmitError(error instanceof Error ? error.message : "Не удалось отправить тест");
    } finally {
      if (submitRunIdRef.current === submitRunId) {
        submitInFlightRef.current = false;
        setSubmitting(false);
      }
    }
  }

  function handleRetry() {
    submitRunIdRef.current += 1;
    submitInFlightRef.current = false;
    setAnswers({});
    setResult(null);
    setLocalReviewResult(null);
    setShowResultPopup(false);
    setShowDetailedReport(false);
    setPlacementResultPending(false);
    setSubmitError(null);
    setCurrentIndex(0);
    resetPlacementTimer();
  }

  function handleAnswer(optionId: string) {
    if (!currentQuestion || timerExpired) return;
    if (submitInFlightRef.current) return;
    const nextAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(nextAnswers);
    setSubmitError(null);
    if (currentIndex < displayQuestions.length - 1) {
      setCurrentIndex((value) => Math.min(displayQuestions.length - 1, value + 1));
      return;
    }
    if (!isPlacement) {
      const nextLocalResult = buildLocalAttemptResult(payload, displayQuestions, nextAnswers);
      setLocalReviewResult(nextLocalResult);
      setShowResultPopup(true);
      setShowDetailedReport(false);
      void handleSubmit(nextAnswers);
    }
  }

  return {
    answeredCount,
    answers,
    canSubmit,
    currentIndex,
    currentQuestion,
    detailResult: result ?? localReviewResult,
    displayQuestions,
    handleAnswer,
    handleRetry,
    handleSubmit,
    isPlacement,
    placementResultPending,
    popupResult: result ?? localReviewResult,
    result,
    setCurrentIndex,
    setShowDetailedReport,
    shouldAutoAdvanceOnSelect,
    showDetailedReport,
    showResultPopup,
    submitError,
    submitting
  };
}
