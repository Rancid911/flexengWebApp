export type ProgressOverview = {
  completedLessons: number;
  totalAttempts: number;
  averageScore: number;
  weakPoints: number;
};

export type ProgressHistoryItem = {
  id: string;
  score: number;
  status: string;
  created_at: string | null;
  submitted_at: string | null;
  title: string;
};

export type ProgressTopic = {
  id: string;
  title: string;
  progressPercent: number;
};

export type ProgressWeakPoint = {
  id: string;
  title: string;
  count: number;
};
