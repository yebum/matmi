import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import CheckLarge from '../../assets/figma/check-large.svg';
import { PrimaryButton, Screen, SecondaryButton, TagChip } from '../../src/components/UI';
import { getSupportedFood } from '../../src/data/supportedFoods';
import { useProfile } from '../../src/store/ProfileContext';
import { colors as c } from '../../src/theme';
import { AllergenWarning } from '../../src/components/AllergenWarning';

export default function TryThis() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dish = getSupportedFood(id);
  const { saveDishToTry, matchFor } = useProfile();
  useEffect(() => { if (dish) saveDishToTry(dish.id); }, [dish?.id]);
  if (!dish) return <Screen><Text>Dish unavailable.</Text></Screen>;
  const match = matchFor(dish);
  return <Screen contentStyle={s.root}><View style={s.top}><View style={s.mark}><CheckLarge width={56} height={56} /></View><Text style={s.title}>Saved to try</Text><Text style={s.subtitle}>{dish.name} is saved as the dish you want to try from this menu.</Text><View style={s.choice}><Text style={s.choiceName}>{dish.name.toLocaleUpperCase()}</Text><AllergenWarning conflicts={match.allergenConflicts} /><View style={s.chips}><TagChip title={`${match.score}% match`} lime /><TagChip title={dish.textureTags[0] ?? 'Savory'} blue /></View><Text style={s.choiceNote}>You can come back to this scan later.</Text></View></View><View style={s.actions}><PrimaryButton title="Done" onPress={() => router.replace('/home')} /><SecondaryButton title="Compare another dish" onPress={() => router.replace('/compare')} /></View></Screen>;
}
const s = StyleSheet.create({ root: { paddingTop: 18, paddingBottom: 18, justifyContent: 'space-between' }, top: { alignItems: 'center' }, mark: { width: 144, height: 144, borderRadius: 72, backgroundColor: c.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, title: { color: c.ink, fontSize: 28, lineHeight: 32, fontWeight: '600', textAlign: 'center', marginBottom: 20 }, subtitle: { color: c.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 286, marginBottom: 20 }, choice: { width: '100%', maxWidth: 320, minHeight: 156, borderRadius: 24, backgroundColor: c.lavender, padding: 16, gap: 10 }, choiceName: { color: c.ink, fontSize: 20, lineHeight: 26, fontWeight: '600' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choiceNote: { color: c.muted, fontSize: 11, lineHeight: 14 }, actions: { gap: 10 } });
