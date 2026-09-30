import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FoodCulture } from '../data/personalization';
import type { ExperienceReview, ReviewDraft } from '../features/communityLens';
import { cleanReviewText, validateReview } from '../features/communityLens';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (!url || !anonKey || !/^https:\/\//i.test(url)) return client = null;
  client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  return client;
}

export function communityConfigured(): boolean { return !!getClient(); }

type ReviewRow = {
  id: string; food_id: string; culture: string; reminded_of: string; cultural_description: string;
  familiarity_score: number; liking_score: number; matmi_accuracy_score: number; created_at: string; is_demo: boolean;
};

export async function listCommunityReviews(foodId: string, culture: FoodCulture): Promise<ExperienceReview[]> {
  const supabase = getClient();
  if (!supabase) throw new Error('Community sharing is not configured yet.');
  const result: ExperienceReview[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('food_experience_reviews')
      .select('id,food_id,culture,reminded_of,cultural_description,familiarity_score,liking_score,matmi_accuracy_score,created_at,is_demo')
      .eq('food_id', foodId).eq('culture', culture.toLowerCase()).order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as ReviewRow[];
    result.push(...rows.map(row => ({ id: row.id, foodId: row.food_id, culture: row.culture.charAt(0).toUpperCase() + row.culture.slice(1) as FoodCulture,
      remindedOf: row.reminded_of, culturalDescription: row.cultural_description, familiarityScore: row.familiarity_score,
      likingScore: row.liking_score, matmiAccuracyScore: row.matmi_accuracy_score, createdAt: row.created_at, isDemo: row.is_demo })));
    if (rows.length < pageSize) return result;
  }
}

export async function submitCommunityReview(foodId: string, culture: FoodCulture, draft: ReviewDraft): Promise<void> {
  const validation = validateReview(foodId, culture, draft);
  if (validation) throw new Error(validation);
  const supabase = getClient();
  if (!supabase) throw new Error('Community sharing is not configured yet. Please try again later.');
  const { error } = await supabase.from('food_experience_reviews').insert({
    food_id: foodId, culture: culture.toLowerCase(), reminded_of: cleanReviewText(draft.remindedOf),
    cultural_description: cleanReviewText(draft.culturalDescription), familiarity_score: draft.familiarityScore,
    liking_score: draft.likingScore, matmi_accuracy_score: draft.matmiAccuracyScore,
  });
  if (error) throw error;
}
