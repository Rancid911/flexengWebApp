import { Suspense } from "react";

import {
  PracticeContinueTopicCard,
  PracticeDoNowCard,
  PracticeOverview,
  PracticeWeakSpotCard
} from "@/features/practice/components/practice-overview";
import { getPracticeOverviewSummary, getPracticeRecommended, getPracticeTopics } from "@/lib/practice/queries";
import { measureServerTiming } from "@/lib/server/timing";

export async function renderPracticeOverviewRoute() {
  const overview = await measureServerTiming("practice-route-context", () => getPracticeOverviewSummary());

  return (
    <PracticeOverview
      doNowSlot={
        <Suspense fallback={<PracticeDoNowCard />}>
          <PracticeDoNowSlot doNowId={overview.doNowId} weakSpotId={overview.weakSpotId} />
        </Suspense>
      }
      continueTopicSlot={
        <Suspense fallback={<PracticeContinueTopicCard />}>
          <PracticeContinueTopicSlot continueTopicSlug={overview.continueTopicSlug} />
        </Suspense>
      }
      weakSpotSlot={
        <Suspense fallback={<PracticeWeakSpotCard />}>
          <PracticeWeakSpotSlot doNowId={overview.doNowId} weakSpotId={overview.weakSpotId} />
        </Suspense>
      }
    />
  );
}

async function PracticeDoNowSlot({ doNowId, weakSpotId }: { doNowId: string | null; weakSpotId: string | null }) {
  const recommended = await getPracticeRecommended();
  const doNow = recommended.find((item) => item.id === doNowId) ?? recommended.find((item) => item.id !== weakSpotId) ?? recommended[0] ?? null;
  return <PracticeDoNowCard item={doNow} />;
}

async function PracticeContinueTopicSlot({ continueTopicSlug }: { continueTopicSlug: string | null }) {
  const topics = await getPracticeTopics();
  const continueTopic = topics.find((topic) => topic.slug === continueTopicSlug) ?? topics[0] ?? null;
  return <PracticeContinueTopicCard topic={continueTopic} />;
}

async function PracticeWeakSpotSlot({ doNowId, weakSpotId }: { doNowId: string | null; weakSpotId: string | null }) {
  const recommended = await getPracticeRecommended();
  const weakSpot = recommended.find((item) => item.id === weakSpotId) ?? recommended.find((item) => item.id !== doNowId) ?? null;
  return <PracticeWeakSpotCard item={weakSpot} />;
}
