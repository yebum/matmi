import type { FoodCulture } from '../data/personalization';
import { isFoodCulture } from '../data/personalization';
import { getSupportedFood } from '../data/supportedFoods';

export type ReviewDraft = {
  remindedOf: string;
  culturalDescription: string;
  familiarityScore: number;
  likingScore: number;
  matmiAccuracyScore: number;
};

export type ExperienceReview = ReviewDraft & {
  id: string;
  foodId: string;
  culture: FoodCulture;
  createdAt: string;
  isDemo: boolean;
};

export const emptyReviewDraft = (): ReviewDraft => ({
  remindedOf: '', culturalDescription: '', familiarityScore: 5, likingScore: 5, matmiAccuracyScore: 5,
});

export function cleanReviewText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateReview(foodId: string, culture: FoodCulture, draft: ReviewDraft): string | null {
  if (!getSupportedFood(foodId)) return 'This dish is unavailable.';
  if (!isFoodCulture(culture)) return 'Choose a supported food culture in your profile.';
  const remindedOf = cleanReviewText(draft.remindedOf);
  const culturalDescription = cleanReviewText(draft.culturalDescription);
  if (remindedOf.length > 160 || culturalDescription.length > 240) return 'Please shorten your response.';
  const meaningful = `${remindedOf} ${culturalDescription}`.match(/\p{L}/gu) ?? [];
  const words = `${remindedOf} ${culturalDescription}`.trim().toLowerCase();
  if (meaningful.length < 3 || /^(.)(\1)+$/u.test(meaningful.join('').toLowerCase()) || /^(asdf|qwer|test|abc|n\/a)$/u.test(words)) return 'Share a little more about your experience.';
  if ([draft.familiarityScore, draft.likingScore, draft.matmiAccuracyScore].some(value => !Number.isInteger(value) || value < 0 || value > 10)) return 'Choose a score from 0 to 10.';
  return null;
}

export function summarizeCommunity(reviews: ExperienceReview[], foodId: string, culture: FoodCulture) {
  const matching = reviews.filter(review => review.foodId === foodId && review.culture === culture);
  const real = matching.filter(review => !review.isDemo);
  const included = (real.length ? real : matching).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  const count = included.length;
  const average = (key: 'familiarityScore' | 'likingScore' | 'matmiAccuracyScore') => count ? Math.round(included.reduce((sum, item) => sum + item[key], 0) * 10 / count) / 10 : null;
  const quotes = included.map(review => review.remindedOf || review.culturalDescription).filter(Boolean).slice(0, 3);
  return { count, demo: count > 0 && real.length === 0, familiarity: average('familiarityScore'), liking: average('likingScore'), accuracy: average('matmiAccuracyScore'), quotes };
}
