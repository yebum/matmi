import { getSupportedFood } from '../data/supportedFoods';

export type FoodJourney = { triedFoodIds: string[]; myReviewIds: string[] };

const reviewIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function migrateFoodJourney(value: unknown): FoodJourney {
  const source = value && typeof value === 'object' ? value as Partial<FoodJourney> : {};
  const triedFoodIds = Array.isArray(source.triedFoodIds)
    ? [...new Set(source.triedFoodIds.filter((id): id is string => typeof id === 'string' && !!getSupportedFood(id)))] : [];
  const myReviewIds = Array.isArray(source.myReviewIds)
    ? [...new Set(source.myReviewIds.filter((id): id is string => typeof id === 'string' && reviewIdPattern.test(id)))] : [];
  return { triedFoodIds, myReviewIds };
}

export function markTried(journey: FoodJourney, foodId: string): FoodJourney {
  if (!getSupportedFood(foodId) || journey.triedFoodIds.includes(foodId)) return journey;
  return { ...journey, triedFoodIds: [...journey.triedFoodIds, foodId] };
}

export function recordReview(journey: FoodJourney, foodId: string, reviewId: string): FoodJourney {
  if (!getSupportedFood(foodId) || !reviewIdPattern.test(reviewId)) return journey;
  const tried = markTried(journey, foodId);
  return tried.myReviewIds.includes(reviewId) ? tried : { ...tried, myReviewIds: [...tried.myReviewIds, reviewId] };
}

export function journeySummary(journey: FoodJourney) {
  const foods = [...new Set(journey.triedFoodIds)].map(getSupportedFood).filter(food => !!food);
  return { foodsTried: foods.length, countries: new Set(foods.map(food => food.country)).size, reviewsShared: new Set(journey.myReviewIds).size };
}
