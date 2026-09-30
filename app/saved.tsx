import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Clock from '../assets/figma/clock.svg';
import { ScanHistoryCard } from '../src/components/DecisionCards';
import { Screen } from '../src/components/UI';
import { getSupportedFood } from '../src/data/supportedFoods';
import { useProfile } from '../src/store/ProfileContext';
import { colors as c } from '../src/theme';

export default function SavedScans() {
  const router = useRouter();
  const { savedScans, setSelectedDishId, matchFor } = useProfile();
  return <Screen nav="home" scroll><View style={s.header}><Text style={s.title}>Saved scans</Text><Clock width={21} height={21} /></View><Text style={s.subtitle}>Your recent food decisions, not another content feed.</Text>{savedScans.map(scan => {
    const dish = getSupportedFood(scan.dishId);
    if (!dish) return null;
    return <View key={`${scan.place}-${scan.dishId}`} style={s.cardWrap}><ScanHistoryCard scan={scan} dish={dish} score={matchFor(dish).score} onPress={() => { setSelectedDishId(dish.id); router.push({ pathname: '/food/[id]', params: { id: dish.id } }); }} /></View>;
  })}</Screen>;
}
const s = StyleSheet.create({ header: { height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: c.ink, fontSize: 26, lineHeight: 34, fontWeight: '600' }, subtitle: { color: c.muted, fontSize: 13, lineHeight: 18, marginTop: 14, marginBottom: 14 }, cardWrap: { marginBottom: 14 } });
