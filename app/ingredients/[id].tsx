import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Info from '../../assets/figma/info.svg';
import { PageHeader, Screen, SecondaryButton, TagChip } from '../../src/components/UI';
import { getSupportedFood } from '../../src/data/supportedFoods';
import { colors as c } from '../../src/theme';

export default function Ingredients() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dish = getSupportedFood(id);
  if (!dish) return <Screen><Text>Dish unavailable.</Text></Screen>;
  return <Screen nav="camera" scroll><PageHeader title="Typical ingredients" onBack={() => router.back()} action={<View style={s.info}><Info width={19} height={19} /></View>} /><Text style={s.name}>{dish.name}</Text><Text style={s.subtitle}>Traditional recipes vary by restaurant.</Text><View style={s.card}><Text style={s.cardLabel}>COMMONLY MADE WITH</Text><View style={s.chips}>{dish.ingredients.slice(0, 3).map(item => <TagChip key={item} title={item} />)}</View><View style={s.chips}>{dish.ingredients.slice(3).map(item => <TagChip key={item} title={item} blue={item === 'Sour cream'} lime={item === 'Cheese'} />)}</View><Text style={s.description}>{dish.description}</Text></View><View style={s.caution}><Text style={s.cautionTitle}>Recipe caution</Text><Text style={s.cautionBody}>This is based on typical preparation, not the exact restaurant recipe.</Text><Text style={s.cautionSmall}>If you have an allergy, confirm ingredients with the restaurant.</Text>{dish.cautions.map(item => <Text key={item} style={s.cautionSmall}>{item}</Text>)}</View><SecondaryButton title="Back to Food Lens" onPress={() => router.back()} /></Screen>;
}
const s = StyleSheet.create({ info: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.gray, alignItems: 'center', justifyContent: 'center' }, name: { color: c.ink, fontSize: 27, lineHeight: 35, fontWeight: '600', marginTop: 14, marginBottom: 14 }, subtitle: { color: c.muted, fontSize: 13, lineHeight: 17, marginBottom: 14 }, card: { minHeight: 204, borderRadius: 24, backgroundColor: c.light, padding: 18, gap: 12, marginBottom: 14 }, cardLabel: { color: c.muted, fontSize: 11, fontWeight: '600' }, chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, description: { color: c.muted, fontSize: 12, lineHeight: 17 }, caution: { minHeight: 142, borderRadius: 22, backgroundColor: '#FFF3E8', padding: 16, gap: 10, marginBottom: 14 }, cautionTitle: { color: '#F28A3A', fontSize: 13, fontWeight: '600' }, cautionBody: { color: c.ink, fontSize: 13, lineHeight: 18, fontWeight: '500' }, cautionSmall: { color: c.muted, fontSize: 11, lineHeight: 15 } });
