export type ReviewTone = "positive" | "mixed" | "negative" | "none";

export interface ReviewScore {
  label: string;
  tone: ReviewTone;
  percent: number;
  total: number;
}

export const REVIEW_TONE_COLOUR: Record<ReviewTone, string> = {
  positive: "#66c0f4",
  mixed: "#b9a074",
  negative: "#a34c25",
  none: "#8f98a0",
};

export function reviewScore(reviews: readonly { recommended: boolean }[]): ReviewScore {
  const total = reviews.length;
  if (total === 0) return { label: "No user reviews", tone: "none", percent: 0, total };
  const percent = Math.round((reviews.filter((r) => r.recommended).length / total) * 100);
  const result = (label: string, tone: ReviewTone): ReviewScore => ({ label, tone, percent, total });

  if (percent >= 95 && total >= 500) return result("Overwhelmingly Positive", "positive");
  if (percent >= 80 && total >= 50) return result("Very Positive", "positive");
  if (percent >= 80) return result("Positive", "positive");
  if (percent >= 70) return result("Mostly Positive", "positive");
  if (percent >= 40) return result("Mixed", "mixed");
  if (percent >= 20) return result("Mostly Negative", "negative");
  return result("Negative", "negative");
}
