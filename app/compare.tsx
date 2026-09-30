import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { FoodComparisonCard } from '../src/components/DecisionCards';
import { PrimaryButton, PageHeader, Screen } from '../src/components/UI';
import { useProfile } from '../src/store/ProfileContext';
import { colors as c } from '../src/theme';

export default function CompareDishes() {
  const router = useRouter();
  const { detectedFoods, matchFor } = useProfile();
  const ranked = [...detectedFoods].sort((a, b) => matchFor(b).score - matchFor(a).score).slice(0, 2);
  if (ranked.length < 2) return <Screen nav="camera" scroll><PageHeader title="Compare dishes" onBack={() => router.back()} /><Text style={s.title}>Scan two supported dishes to compare them.</Text><PrimaryButton title="Back to results" onPress={() => router.push('/results')} /></Screen>;
  return <Screen nav="camera" scroll><PageHeader title="Compare dishes" onBack={() => router.back()} /><Text style={s.title}>{'Which one feels right for\nyou?'}</Text><Text style={s.subtitle}>{'Compare only the differences that matter to your\ndecision.'}</Text>{ranked.map((food, index) => <FoodComparisonCard key={food.id} dish={food} score={matchFor(food).score} highlighted={index === 0} character={food.subtitle} familiarity={matchFor(food).score >= 75 ? 'High' : 'Explore'} texture={food.textureTags.join(' · ')} risk={matchFor(food).warnings.length ? 'Check ingredients' : 'Typical recipe varies'} />)}<PrimaryButton title={`View ${ranked[0].name}`} onPress={() => router.push({ pathname: '/food/[id]', params: { id: ranked[0].id } })} /></Screen>;
}
const s = StyleSheet.create({ title: { color: c.ink, fontSize: 24, lineHeight: 28, fontWeight: '600', marginTop: 14, marginBottom: 14 }, subtitle: { color: c.muted, fontSize: 13, lineHeight: 18, marginBottom: 14 } });
