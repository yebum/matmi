import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SupportedFood } from '../data/supportedFoods';
import type { SavedScan } from '../store/ProfileContext';
import { colors as c } from '../theme';

export function FoodComparisonCard({ dish, score, familiarity, texture, character, risk, highlighted = false }: {
  dish: SupportedFood; score: number; familiarity: string; texture: string; character: string; risk: string; highlighted?: boolean;
}) {
  return <View style={[s.compare, highlighted ? { backgroundColor: c.lavender } : { backgroundColor: c.paleLime }]}>
    <View style={s.compareHead}><Text style={s.compareName}>{dish.name}</Text><View style={s.score}><Text style={s.scoreText}>{score}%</Text></View></View>
    <Text style={s.character}>{character}</Text>
    <View style={s.fact}><Text style={s.factLabel}>Familiarity</Text><Text style={s.factValue}>{familiarity}</Text></View>
    <View style={s.fact}><Text style={s.factLabel}>Texture</Text><Text style={s.factValue}>{texture}</Text></View>
    <View style={s.fact}><Text style={s.factLabel}>Risk for you</Text><Text style={s.factValue}>{risk}</Text></View>
  </View>;
}

export function ScanHistoryCard({ scan, dish, score, onPress }: { scan: SavedScan; dish: SupportedFood; score: number; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={s.history}>
    <View style={s.placeRow}><Text style={s.place}>{scan.place}</Text><Text style={s.date}>{scan.date}</Text></View>
    <View style={s.dishRow}><View><Text style={s.dishName}>{dish.name}</Text><Text style={s.saved}>Saved to try</Text></View><View style={s.historyScore}><Text style={s.historyScoreText}>{score}%</Text></View></View>
  </Pressable>;
}

const s = StyleSheet.create({
  compare: { minHeight: 210, borderRadius: 24, padding: 16, gap: 10, marginBottom: 14 },
  compareHead: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  compareName: { color: c.ink, fontSize: 18, lineHeight: 23, fontWeight: '600', flexShrink: 1 },
  score: { width: 76, height: 32, borderRadius: 16, backgroundColor: c.white, justifyContent: 'center', alignItems: 'center' },
  scoreText: { color: c.ink, fontSize: 12, fontWeight: '700' },
  character: { color: c.muted, fontSize: 12, lineHeight: 16 },
  fact: { minHeight: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  factLabel: { color: c.muted, fontSize: 11, fontWeight: '500' },
  factValue: { color: c.ink, fontSize: 11, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  history: { minHeight: 128, backgroundColor: c.light, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 15, gap: 10 },
  placeRow: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  place: { color: c.ink, fontSize: 14, fontWeight: '600' }, date: { color: c.muted, fontSize: 11 },
  dishRow: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dishName: { color: c.ink, fontSize: 17, lineHeight: 22, fontWeight: '600' }, saved: { color: c.muted, fontSize: 11, marginTop: 3 },
  historyScore: { width: 74, height: 30, borderRadius: 15, backgroundColor: c.paleLime, justifyContent: 'center', alignItems: 'center' },
  historyScoreText: { color: c.ink, fontSize: 11, fontWeight: '700' },
});
