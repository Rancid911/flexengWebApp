export type PlacementBandKey =
  | "beginner"
  | "elementary"
  | "pre_intermediate"
  | "intermediate"
  | "upper_intermediate"
  | "advanced";

export type PlacementBandRule = {
  key: PlacementBandKey;
  label: string;
  minScore: number;
  maxScore: number;
};

export type PlacementScoringProfile = {
  kind: "placement_v1";
  bands: PlacementBandRule[];
};

export type PlacementSectionScore = {
  key: PlacementBandKey;
  label: string;
  correctAnswers: number;
  totalQuestions: number;
};

export type PlacementSummary = {
  recommendedLevel: string;
  recommendedBandLabel: string;
  sectionScores: PlacementSectionScore[];
};

export const DEFAULT_PLACEMENT_SCORING_PROFILE: PlacementScoringProfile = {
  kind: "placement_v1",
  bands: [
    { key: "beginner", label: "Beginner", minScore: 0, maxScore: 6 },
    { key: "elementary", label: "Elementary", minScore: 7, maxScore: 20 },
    { key: "pre_intermediate", label: "Pre-Intermediate", minScore: 21, maxScore: 34 },
    { key: "intermediate", label: "Intermediate", minScore: 35, maxScore: 48 },
    { key: "upper_intermediate", label: "Upper-Intermediate", minScore: 49, maxScore: 62 },
    { key: "advanced", label: "Advanced", minScore: 63, maxScore: 70 }
  ]
};

type PlacementQuestionReview = {
  isCorrect: boolean;
  placementBand: PlacementBandKey | null;
};

function isPlacementBandKey(value: unknown): value is PlacementBandKey {
  return (
    value === "beginner" ||
    value === "elementary" ||
    value === "pre_intermediate" ||
    value === "intermediate" ||
    value === "upper_intermediate" ||
    value === "advanced"
  );
}

export function isPlacementScoringProfile(value: unknown): value is PlacementScoringProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { kind?: unknown; bands?: unknown };
  if (candidate.kind !== "placement_v1" || !Array.isArray(candidate.bands)) return false;

  return candidate.bands.every((band) => {
    if (!band || typeof band !== "object") return false;
    const rule = band as Record<string, unknown>;
    return (
      isPlacementBandKey(rule.key) &&
      typeof rule.label === "string" &&
      typeof rule.minScore === "number" &&
      typeof rule.maxScore === "number"
    );
  });
}

export function parsePlacementScoringProfile(value: unknown): PlacementScoringProfile | null {
  return isPlacementScoringProfile(value) ? value : null;
}

function getBandLabel(rule: PlacementBandRule, score: number) {
  const span = rule.maxScore - rule.minScore + 1;
  const margin = Math.max(2, Math.floor(span / 3));

  if (score <= rule.minScore + margin - 1 && score > rule.minScore) {
    return `Lower part of ${rule.label}`;
  }

  if (score >= rule.maxScore - margin + 1 && score < rule.maxScore) {
    return `Upper part of ${rule.label}`;
  }

  return rule.label;
}

export function buildPlacementSummary(
  score: number,
  questions: PlacementQuestionReview[],
  scoringProfile: PlacementScoringProfile
): PlacementSummary {
  const matchingRule =
    scoringProfile.bands.find((band) => score >= band.minScore && score <= band.maxScore) ??
    scoringProfile.bands[scoringProfile.bands.length - 1];

  const sectionScores = scoringProfile.bands.map((band) => {
    const bandQuestions = questions.filter((question) => question.placementBand === band.key);
    return {
      key: band.key,
      label: band.label,
      correctAnswers: bandQuestions.filter((question) => question.isCorrect).length,
      totalQuestions: bandQuestions.length
    };
  });

  return {
    recommendedLevel: matchingRule.label,
    recommendedBandLabel: getBandLabel(matchingRule, score),
    sectionScores
  };
}
