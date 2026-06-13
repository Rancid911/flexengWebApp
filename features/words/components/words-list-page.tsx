import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StudentEmptyState, StudentPageHeader } from "@/shared/ui/student-page-primitives";

import { WordsSubnav, type WordsSubnavItem } from "@/features/words/components/words-subnav";

type WordsListItem = {
  id: string;
  term: string;
  translation: string;
  example: string;
  status?: string;
  topicTitle?: string;
};

type WordsListPageProps = {
  words: WordsListItem[];
  active: WordsSubnavItem;
  title: string;
  description: string;
  action: { href: string; label: string } | null;
  emptyTitle: string;
  emptyDescription: string;
  topicTone?: "blue" | "amber";
  showStatus?: boolean;
};

export function WordsListPage({
  words,
  active,
  title,
  description,
  action,
  emptyTitle,
  emptyDescription,
  topicTone = "blue",
  showStatus = false
}: WordsListPageProps) {
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader
        title={title}
        description={description}
        actions={
          action ? (
            <Link href={action.href} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1f7aff] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1669db]">
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null
        }
      />
      <WordsSubnav active={active} />
      {words.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {words.map((item) => (
            <WordPreviewCard key={item.id} item={item} showStatus={showStatus} topicTone={topicTone} />
          ))}
        </div>
      ) : (
        <StudentEmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}

function WordPreviewCard({ item, showStatus, topicTone }: { item: WordsListItem; showStatus: boolean; topicTone: "blue" | "amber" }) {
  return (
    <Card className="rounded-[1.4rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-2 p-5">
        {item.topicTitle ? <p className={`text-sm font-bold ${topicTone === "amber" ? "text-amber-700" : "text-[#1f7aff]"}`}>{item.topicTitle}</p> : null}
        <p className="text-2xl font-black tracking-tight text-slate-900">{item.term}</p>
        <p className="text-base text-slate-600">{item.translation}</p>
        <p className="text-sm text-slate-500">{item.example}</p>
        {showStatus && item.status ? <p className="text-xs font-bold uppercase text-indigo-700">{item.status}</p> : null}
      </CardContent>
    </Card>
  );
}
