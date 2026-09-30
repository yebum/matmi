import { defaultSensitivities, foodCultures, isAllergen, isFoodCulture, sensitivityFields, type Allergen, type FoodCulture, type FoodSensitivityProfile } from '../data/personalization';

export type TasteProfile = { culture: FoodCulture; likes: string[]; avoids: string[]; sensitivities: FoodSensitivityProfile; allergens: Allergen[] };
export const initialProfile: TasteProfile = { culture: 'Korean', likes: ['Fried food', 'Cheese', 'Beef', 'Crispy', 'Spicy'], avoids: ['Strong fish smell'], sensitivities: { ...defaultSensitivities }, allergens: [] };

export function migrateProfile(input: unknown): TasteProfile {
  if (!input || typeof input !== 'object') return { ...initialProfile, sensitivities: { ...defaultSensitivities }, allergens: [] };
  const old = input as Record<string, unknown>;
  const culture = isFoodCulture(old.culture) ? old.culture : foodCultures.find(item => item.value.toLowerCase() === old.culture)?.value ?? 'Korean';
  const likes = Array.isArray(old.likes) ? old.likes.filter((item): item is string => typeof item === 'string') : [...initialProfile.likes];
  const oldAvoids = Array.isArray(old.avoids) ? old.avoids.filter((item): item is string => typeof item === 'string') : [...initialProfile.avoids];
  const legacyOrgan = typeof old.avoidOrganMeat === 'boolean' ? old.avoidOrganMeat : oldAvoids.includes('Organ meat');
  const saved = old.sensitivities && typeof old.sensitivities === 'object' ? old.sensitivities as Record<string, unknown> : {};
  const sensitivities = { ...defaultSensitivities };
  for (const field of sensitivityFields) {
    const value = saved[field.key];
    if (typeof value === 'number' && Number.isFinite(value)) sensitivities[field.key] = Math.max(0, Math.min(10, Math.round(value)));
  }
  if (saved.organMeat === undefined && (typeof old.avoidOrganMeat === 'boolean' || oldAvoids.includes('Organ meat'))) sensitivities.organMeat = legacyOrgan ? 1 : 6;
  const allergens = Array.isArray(old.allergens) ? [...new Set(old.allergens.filter(isAllergen))] : [];
  return { culture, likes, avoids: oldAvoids.filter(item => item !== 'Organ meat'), sensitivities, allergens };
}
