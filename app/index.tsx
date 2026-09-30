import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LensSymbol from '../assets/figma/lens-symbol.svg';
import { PrimaryButton, Screen, textStyles } from '../src/components/UI';
import { colors as c } from '../src/theme';

export default function Welcome() {
  const router = useRouter();
  return <Screen contentStyle={s.root}><View><Text style={s.brand}>AI FOOD LENS</Text><View style={s.hero}><LensSymbol width={170} height={170} /></View><Text style={s.title}>{'Turn unfamiliar food\ninto a familiar\nexperience.'}</Text><Text style={[textStyles.body, s.description]}>Scan a local menu and understand the dish through food experiences you already know.</Text></View><View><PrimaryButton title="Get started" onPress={() => router.push('/culture')} /><Pressable onPress={() => router.push('/home')} style={s.existing}><Text style={s.existingText}>I already have a profile</Text></Pressable></View></Screen>;
}
const s = StyleSheet.create({ root: { justifyContent: 'space-between' }, brand: { color: c.blue, fontSize: 12, fontWeight: '600', lineHeight: 16, marginBottom: 18 }, hero: { height: 282, borderRadius: 28, backgroundColor: c.lavender, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, title: { color: c.ink, fontSize: 29, lineHeight: 33, fontWeight: '600', marginBottom: 18 }, description: { maxWidth: 330 }, existing: { height: 26, justifyContent: 'flex-end' }, existingText: { color: c.muted, fontSize: 13, fontWeight: '500' } });
