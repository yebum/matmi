import { Pressable, StyleSheet, Text, View } from 'react-native';
import { allergenOptions, type Allergen } from '../data/personalization';
import { colors as c } from '../theme';

export function AllergenSelector({ selected, onToggle }: { selected: Allergen[]; onToggle: (value: Allergen | 'none') => void }) {
  return <View style={s.chips}>{[...allergenOptions, { value: 'none' as const, label: 'None' }].map(item => {
    const active = item.value === 'none' ? selected.length === 0 : selected.includes(item.value);
    return <Pressable key={item.value} accessibilityRole="checkbox" aria-checked={active} accessibilityLabel={item.label} onPress={() => onToggle(item.value)} style={[s.chip, active && s.active]}><Text style={[s.chipText, active && s.activeText]}>{active ? '✓ ' : ''}{item.label}</Text></Pressable>;
  })}</View>;
}
const s = StyleSheet.create({ chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 42, borderRadius: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.white, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, active: { backgroundColor: c.lavender, borderColor: c.blue }, chipText: { color: c.ink, fontSize: 12, fontWeight: '500' }, activeText: { color: c.blue, fontWeight: '700' } });
