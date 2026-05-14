import { WordsListPage } from "@/features/words/components/words-list-page";
import { getDifficultWords, getNewWords, getWordsForReview } from "@/lib/words/queries";

export async function renderWordsReviewRoute() {
  const words = await getWordsForReview();

  return (
    <WordsListPage
      words={words}
      active="review"
      title="Повторить сегодня"
      description="Слова, которые система считает нужным повторить сейчас."
      action={words.length > 0 ? { href: "/words/train?mode=review&limit=10", label: "Начать повторение" } : null}
      emptyTitle="Сегодня нет слов для повторения"
      emptyDescription="Можно изучить новые слова."
      showStatus
    />
  );
}

export async function renderWordsNewRoute() {
  const words = await getNewWords();

  return (
    <WordsListPage
      words={words}
      active="new"
      title="Новые слова"
      description="Слова из встроенных тем, которые вы ещё не закрепляли."
      action={{ href: "/words/train?mode=new&limit=5", label: "Изучить новые" }}
      emptyTitle="Новых слов пока нет"
      emptyDescription="Выберите тему на экране карточек или повторите уже добавленные слова."
    />
  );
}

export async function renderWordsDifficultRoute() {
  const words = await getDifficultWords();

  return (
    <WordsListPage
      words={words}
      active="difficult"
      title="Сложные слова"
      description="Слова, которые вы отметили сложными или не смогли вспомнить."
      action={words.length > 0 ? { href: "/words/train?mode=difficult&limit=10", label: "Повторить сложные" } : null}
      emptyTitle="Сложных слов пока нет"
      emptyDescription="Если слово не вспомнится на тренировке, оно появится здесь."
      topicTone="amber"
      showStatus
    />
  );
}
