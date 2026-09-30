import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Check from '../assets/figma/check.svg';
import Chevron from '../assets/figma/chevron.svg';
import { PageHeader, PrimaryButton, Screen, SetupProgress, textStyles } from '../src/components/UI';
import { useProfile } from '../src/store/ProfileContext';
import { colors as c } from '../src/theme';

const cultures = ['Korean', 'Japanese', 'American', 'Chinese', 'French', 'Hungarian'];
export default function Culture() {
  const router = useRouter();
  const { culture, setCulture } = useProfile();
  const [choosing, setChoosing] = useState(false);
  return <Screen contentStyle={s.root}><View><PageHeader title="Set up" onBack={() => router.back()} /><SetupProgress step={1} /><Text style={[textStyles.heading, s.title]}>{'What food feels familiar\nto you?'}</Text><Text style={[textStyles.body, s.description]}>We’ll use one familiar food culture as the reference point for comparisons.</Text><View style={s.selected}><View style={s.mark}><Text style={s.markText}>{culture === 'Korean' ? 'KR' : culture.slice(0, 2).toUpperCase()}</Text></View><View style={s.selectedCopy}><Text style={s.cultureName}>{culture} food</Text><Text style={s.suggestion}>Suggested from language</Text></View><View style={s.selectedCheck}><Check width={18} height={18} /></View></View><Pressable accessibilityRole="button" onPress={() => setChoosing(!choosing)} style={s.change}><Text style={s.changeText}>Choose another culture</Text><Chevron width={18} height={18} /></Pressable>{choosing && <View style={s.cultureList}>{cultures.map(option => <Pressable key={option} onPress={() => { setCulture(option); setChoosing(false); }} style={s.cultureOption}><Text style={s.changeText}>{option} food</Text>{culture === option && <Check width={16} height={16} />}</Pressable>)}</View>}</View><PrimaryButton title="Continue" onPress={() => router.push('/preference')} /></Screen>;
}
const s = StyleSheet.create({ root: { justifyContent: 'space-between' }, title: { marginBottom: 18 }, description: { marginBottom: 18 }, selected: { height: 94, borderRadius: 24, backgroundColor: c.lavender, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }, mark: { width: 52, height: 52, borderRadius: 18, backgroundColor: c.white, alignItems: 'center', justifyContent: 'center', marginRight: 14 }, markText: { color: c.blue, fontSize: 13, fontWeight: '700' }, selectedCopy: { flex: 1, gap: 4 }, cultureName: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: c.ink }, suggestion: { fontSize: 12, color: c.muted }, selectedCheck: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.lime, justifyContent: 'center', alignItems: 'center' }, change: { height: 48, borderRadius: 16, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }, changeText: { color: c.ink, fontSize: 14, fontWeight: '500' }, cultureList: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderRadius: 16, marginTop: 6, overflow: 'hidden' }, cultureOption: { paddingHorizontal: 16, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } });
