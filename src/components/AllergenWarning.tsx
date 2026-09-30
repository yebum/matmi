import { StyleSheet, Text, View } from 'react-native';
import { allergenWarning } from '../features/tasteMatch';
import type { Allergen } from '../data/personalization';

export function AllergenWarning({ conflicts }: { conflicts: Allergen[] }) {
  if (!conflicts.length) return null;
  return <View accessibilityRole="alert" style={s.box}><Text style={s.title}>⚠ {allergenWarning(conflicts)}</Text><Text style={s.copy}>Recipes vary. Confirm ingredients with the restaurant.</Text></View>;
}
const s = StyleSheet.create({ box: { borderRadius: 18, borderWidth: 1, borderColor: '#EAC2B5', backgroundColor: '#FFF3EE', padding: 14, marginBottom: 13 }, title: { color: '#9A3E27', fontSize: 14, lineHeight: 20, fontWeight: '700' }, copy: { color: '#8D5547', fontSize: 12, lineHeight: 17, marginTop: 4 } });
