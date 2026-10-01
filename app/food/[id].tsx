import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Bookmark from '../../assets/figma/bookmark.svg';
import Chevron from '../../assets/figma/chevron.svg';
import Check from '../../assets/figma/check.svg';
import { PageHeader, PrimaryButton, Screen, TagChip } from '../../src/components/UI';
import { getSupportedFood } from '../../src/data/supportedFoods';
import { useProfile } from '../../src/store/ProfileContext';
import { colors as c } from '../../src/theme';
import { FoodModelPreview } from '../../src/components/FoodModelPreview';
import { AllergenWarning } from '../../src/components/AllergenWarning';
import { CommunityLens } from '../../src/components/CommunityLens';

export default function FoodDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dish = getSupportedFood(id);
  const { culture, saveDishToTry, setSelectedDishId, savedDishIds, triedFoodIds, markFoodTried, matchFor } = useProfile();
  useEffect(() => { if (dish) setSelectedDishId(dish.id); }, [dish?.id]);
  if (!dish) return <Screen><PageHeader title="Food Lens" onBack={() => router.back()} /><Text>Dish unavailable.</Text></Screen>;
  const comparison = dish.comparisons[culture] ?? dish.comparisons.default;
  const match = matchFor(dish);
  const warnings = [...new Set([...match.warnings, ...dish.cautions])];
  return <Screen nav="camera" scroll>
    <PageHeader title="Food Lens" onBack={() => router.back()} action={<Pressable accessibilityRole="button" accessibilityLabel="Save dish" onPress={() => saveDishToTry(dish.id)} style={[s.bookmark, savedDishIds.includes(dish.id) && { backgroundColor: c.paleLime }]}><Bookmark width={19} height={19} /></Pressable>} />
    <View style={s.titleBlock}><Text style={s.eyebrow}>{dish.country.toLocaleUpperCase()} · {dish.category}</Text><Text style={s.name}>{dish.name}</Text><View style={s.tags}>{[...dish.tasteTags, ...dish.textureTags].slice(0, 3).map((tag, index) => <TagChip key={tag} title={tag} blue={index === 1} />)}</View></View>
    <AllergenWarning conflicts={match.allergenConflicts} />
    <View style={s.match}><View><Text style={s.matchLabel}>TASTE MATCH</Text><Text style={s.score}>{match.score}%</Text></View><View style={s.fitBlock}><Text style={s.fit}>{match.allergenConflicts.length ? 'Check allergens' : match.score >= 75 ? 'Strong fit' : 'Consider first'}</Text><Text style={s.fitDetail}>{dish.subtitle}</Text></View></View>
    <View style={s.familiar}><Text style={s.sectionLabel}>MAKE IT FAMILIAR</Text><Text style={s.comparison}>{comparison}</Text><Text style={s.context}>{dish.description}</Text></View>
    <FoodModelPreview food={dish} />
    <View style={s.why}><Text style={s.whyTitle}>Why it matches you</Text>{match.positiveReasons.length === 0 && <Text style={s.reasonText}>A new taste to explore based on your profile.</Text>}{match.positiveReasons.slice(0, 3).map(reason => <View key={reason} style={s.reason}><View style={s.reasonIcon}><Check width={12} height={12} /></View><Text style={s.reasonText}>{reason}</Text></View>)}{warnings.map((caution, index) => <Text key={caution} style={[s.caution, index === 0 && s.firstCaution]}>{caution}</Text>)}</View>
    <CommunityLens foodId={dish.id} culture={culture} onShare={() => router.push(`/review/${dish.id}` as never)} />
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/ingredients/[id]', params: { id: dish.id } })} style={s.ingredients}><Text style={s.ingredientsLabel}>Typical ingredients</Text><Chevron width={17} height={17} /></Pressable>
    <View style={s.tryButton}><PrimaryButton title={triedFoodIds.includes(dish.id) ? '✓ Added to your Food Journey' : 'I tried this'} onPress={() => markFoodTried(dish.id)} /></View>
  </Screen>;
}
const s = StyleSheet.create({
  bookmark: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.gray, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { marginTop: 13, marginBottom: 5 }, eyebrow: { color: c.blue, fontSize: 11, fontWeight: '600', marginBottom: 5 },
  name: { color: c.ink, fontSize: 30, lineHeight: 39, fontWeight: '600', marginBottom: 5 }, tags: { flexDirection: 'row', gap: 7 },
  match: { minHeight: 100, borderRadius: 24, backgroundColor: c.paleLime, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 13 },
  matchLabel: { color: c.muted, fontSize: 11, fontWeight: '600' }, score: { color: c.ink, fontSize: 34, lineHeight: 44, fontWeight: '700' },
  fitBlock: { flexShrink: 1, maxWidth: 138 }, fit: { color: c.ink, fontSize: 13, lineHeight: 18, fontWeight: '600', marginBottom: 3, flexShrink: 1 }, fitDetail: { color: c.muted, fontSize: 10, lineHeight: 14, flexShrink: 1 },
  familiar: { minHeight: 178, borderRadius: 24, backgroundColor: c.lavender, padding: 18, marginBottom: 13 },
  sectionLabel: { color: c.blue, fontSize: 11, fontWeight: '600', marginBottom: 10 },
  comparison: { color: c.ink, fontSize: 17, lineHeight: 22, fontWeight: '600', marginBottom: 10, flexShrink: 1 },
  context: { color: c.muted, fontSize: 12, lineHeight: 17, flexShrink: 1 },
  why: { minHeight: 110, borderRadius: 22, backgroundColor: c.light, padding: 16, gap: 10, marginBottom: 13 },
  whyTitle: { color: c.ink, fontSize: 14, lineHeight: 20, fontWeight: '600' }, reason: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 24, gap: 9 },
  reasonIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: c.lime, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reasonText: { color: c.ink, fontSize: 12, lineHeight: 17, fontWeight: '500', flexShrink: 1 }, caution: { color: '#B85037', fontSize: 12, lineHeight: 17, flexShrink: 1 }, firstCaution: { marginTop: 4 },
  ingredients: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ingredientsLabel: { color: c.ink, fontSize: 13, fontWeight: '500' }, tryButton: { marginTop: 14, marginBottom: 8 },
});
