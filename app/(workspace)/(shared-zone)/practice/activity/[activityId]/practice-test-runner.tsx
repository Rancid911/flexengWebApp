"use client";

import { useRouter } from "next/navigation";

import {
  PracticeDetailedReport,
  PracticeQuestionCard,
  PracticeQuestionNavigator,
  PracticeResultPopup,
  PracticeRunnerHeader,
  UnsupportedPracticeActivity
} from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/practice-test-runner-sections";
import { usePlacementNavigationGuard } from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/use-placement-navigation-guard";
import {
  beginPlacementTest,
  clearPlacementStartedFlag,
  formatCountdown,
  readPlacementStartedFlag,
  usePlacementTestTimer
} from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/use-placement-test-timer";
import { usePracticeAttemptRunner } from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/use-practice-attempt-runner";
import type { PracticeTestActivityDetail } from "@/lib/practice/queries";

type Props = {
  payload: PracticeTestActivityDetail;
  placementStarted?: boolean;
};

export { beginPlacementTest, clearPlacementStartedFlag, readPlacementStartedFlag };

function formatMeta(payload: PracticeTestActivityDetail) {
  if (payload.assessmentKind === "placement") {
    return [payload.timeLimitMinutes ? `${payload.timeLimitMinutes} минут` : null, payload.assigned ? "назначено преподавателем" : null]
      .filter(Boolean)
      .join(" · ");
  }
  return [
    payload.cefrLevel,
    payload.drillTopicKey,
    payload.drillKind,
    payload.timeLimitMinutes ? `${payload.timeLimitMinutes} минут` : null,
    payload.assigned ? "назначено преподавателем" : null
  ]
    .filter(Boolean)
    .join(" · ");
}

function getActivityBadgeTone(activityType: PracticeTestActivityDetail["activityType"]) {
  return activityType === "trainer"
    ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.28)]"
    : "bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-700 text-white shadow-[0_10px_24px_rgba(91,33,182,0.24)]";
}

export function PracticeTestRunner({ payload, placementStarted = false }: Props) {
  const router = useRouter();
  const placementTimeLimitMinutes = typeof payload.timeLimitMinutes === "number" && payload.timeLimitMinutes > 0 ? payload.timeLimitMinutes : null;
  const isPlacementWithTimer = payload.assessmentKind === "placement" && placementTimeLimitMinutes !== null && placementStarted;
  const { remainingSeconds, resetPlacementTimer, startedAtRef, stopPlacementTimer, timerExpired } = usePlacementTestTimer({
    activityId: payload.id,
    enabled: isPlacementWithTimer,
    timeLimitMinutes: placementTimeLimitMinutes
  });
  const isPlacement = payload.assessmentKind === "placement";

  const { allowNavigationRef, handleExit } = usePlacementNavigationGuard({ activityId: payload.id, active: isPlacementWithTimer && placementStarted });
  const attemptRunner = usePracticeAttemptRunner({
    allowNavigationRef,
    payload,
    resetPlacementTimer,
    startedAtRef,
    stopPlacementTimer,
    timerExpired
  });
  const isActivePlacementAttempt = isPlacementWithTimer && !attemptRunner.result && placementStarted;

  if (!payload.isSupported) {
    return <UnsupportedPracticeActivity payload={payload} badgeTone={getActivityBadgeTone(payload.activityType)} metaText={formatMeta(payload)} />;
  }

  const canOpenDetailedReport = Boolean(attemptRunner.detailResult) && (!isPlacement || Boolean(attemptRunner.result));
  const sectionHref = !isPlacement ? payload.sectionHref : null;

  function handleReturnToSection() {
    if (!sectionHref) return;
    router.push(sectionHref);
  }

  if (attemptRunner.showDetailedReport && attemptRunner.detailResult) {
    return (
      <PracticeDetailedReport
        detailResult={attemptRunner.detailResult}
        sectionHref={sectionHref}
        onReturnToSection={handleReturnToSection}
        onRetry={attemptRunner.handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {attemptRunner.showResultPopup ? (
        <PracticeResultPopup
          popupResult={attemptRunner.popupResult}
          isPlacement={isPlacement}
          placementResultPending={attemptRunner.placementResultPending}
          submitError={attemptRunner.submitError}
          sectionHref={sectionHref}
          canOpenDetailedReport={canOpenDetailedReport}
          hasSavedResult={Boolean(attemptRunner.result)}
          onRetry={attemptRunner.handleRetry}
          onReturnToSection={handleReturnToSection}
          onOpenDetailedReport={() => attemptRunner.setShowDetailedReport(true)}
        />
      ) : null}

      <PracticeRunnerHeader
        payload={payload}
        badgeTone={getActivityBadgeTone(payload.activityType)}
        metaText={formatMeta(payload)}
        isPlacementWithTimer={isPlacementWithTimer}
        timerExpired={timerExpired}
        remainingSeconds={remainingSeconds}
        currentIndex={attemptRunner.currentIndex}
        totalQuestions={attemptRunner.displayQuestions.length}
        formatCountdown={formatCountdown}
      />

      <PracticeQuestionNavigator
        questions={attemptRunner.displayQuestions}
        answers={attemptRunner.answers}
        currentIndex={attemptRunner.currentIndex}
        timerExpired={timerExpired}
        onSelectQuestion={(index) => {
          if (timerExpired) return;
          attemptRunner.setCurrentIndex(index);
        }}
      />

      <PracticeQuestionCard
        currentQuestion={attemptRunner.currentQuestion}
        displayQuestions={attemptRunner.displayQuestions}
        answers={attemptRunner.answers}
        answeredCount={attemptRunner.answeredCount}
        timerExpired={timerExpired}
        submitting={attemptRunner.submitting}
        submitError={attemptRunner.submitError}
        shouldAutoAdvanceOnSelect={attemptRunner.shouldAutoAdvanceOnSelect}
        canSubmit={attemptRunner.canSubmit}
        isPlacement={isPlacement}
        isActivePlacementAttempt={isActivePlacementAttempt}
        onAnswer={attemptRunner.handleAnswer}
        onRetry={attemptRunner.handleRetry}
        onSubmit={() => void attemptRunner.handleSubmit()}
        onExit={handleExit}
      />
    </div>
  );
}
