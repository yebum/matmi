import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c } from '../theme';
import BackIcon from '../../assets/figma/back.svg';
import HomeDark from '../../assets/figma/home-dark.svg';
import HomeMuted from '../../assets/figma/home-muted.svg';
import CameraDark from '../../assets/figma/camera-dark.svg';
import CameraMuted from '../../assets/figma/camera-muted.svg';
import UserMuted from '../../assets/figma/user-muted.svg';
import UserDark from '../../assets/figma/user-dark.svg';

export function Screen({ children, nav, scroll = true, contentStyle }: { children: ReactNode; nav?: 'home' | 'camera' | 'profile'; scroll?: boolean; contentStyle?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  return <View style={[s.screen, Platform.OS === 'web' ? { paddingTop: Math.max(16, insets.top) } : { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
    {scroll ? <ScrollView style={s.body} contentContainerStyle={[s.content, s.scrollContent, contentStyle, nav && { paddingBottom: 32 }]} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      : <View style={[s.body, s.content, contentStyle]}>{children}</View>}
    {nav && <FloatingBottomNav active={nav} />}
  </View>;
}
export function PrimaryButton({ title, onPress, light = false }: { title: string; onPress: () => void; light?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[s.primaryButton, light && s.lightButton]}><Text style={[s.primaryText, light && { color: c.ink }]}>{title}</Text></Pressable>;
}
export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={s.secondaryButton}><Text style={s.secondaryText}>{title}</Text></Pressable>;
}
export function PageHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: ReactNode }) {
  return <View style={s.header}><View style={s.headerLeft}><Pressable accessibilityLabel="Back" onPress={onBack} style={s.roundButton}><BackIcon width={20} height={20} /></Pressable><Text style={s.headerTitle}>{title}</Text></View>{action}</View>;
}
export function SetupProgress({ step }: { step: 1 | 2 }) {
  return <><View style={s.progress}><View style={[s.progressFill, { width: step === 1 ? 48 : 96 }]} /></View><Text style={s.step}>STEP {step} OF 2</Text></>;
}
export function TagChip({ title, blue = false, lime = false }: { title: string; blue?: boolean; lime?: boolean }) {
  return <View style={[s.tag, blue && { backgroundColor: c.lavender }, lime && { backgroundColor: c.paleLime }]}><Text style={[s.tagText, blue && { color: c.blue }]}>{title}</Text></View>;
}
export function MatchBadge({ score, full = false }: { score: number; full?: boolean }) {
  return <View style={[s.match, score >= 90 ? { backgroundColor: c.lime } : score >= 70 ? { backgroundColor: c.paleLime } : { backgroundColor: c.gray }, full && { minWidth: 88, height: 34 }]}><Text style={[s.matchText, score < 50 && { color: c.muted }]}>{score}%{full ? ' MATCH' : ''}</Text></View>;
}
export function FoodCard({ children, onPress, style }: { children: ReactNode; onPress: () => void; style?: ViewStyle }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[s.foodCard, style]}>{children}</Pressable>;
}
export function PreferenceCard({ children }: { children: ReactNode }) { return <View style={s.preferenceCard}>{children}</View>; }
export function FloatingBottomNav({ active }: { active: 'home' | 'camera' | 'profile' }) {
  const router = useRouter();
  return <View style={[s.navArea, Platform.OS !== 'web' && { height: 64 }]}><View style={s.nav}><Pressable accessibilityRole="button" accessibilityLabel="Home" onPress={() => router.push('/home')} style={[s.navItem, active === 'home' && s.navActive]}>{active === 'home' ? <HomeDark width={21} height={21} /> : <HomeMuted width={21} height={21} />}</Pressable><Pressable accessibilityRole="button" accessibilityLabel="Scanner" onPress={() => router.push('/scanner')} style={[s.navItem, active === 'camera' && s.navActive]}>{active === 'camera' ? <CameraDark width={21} height={21} /> : <CameraMuted width={21} height={21} />}</Pressable><Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.push('/profile')} style={[s.navItem, active === 'profile' && s.navActive]}>{active === 'profile' ? <UserDark width={21} height={21} /> : <UserMuted width={21} height={21} />}</Pressable></View>{Platform.OS === 'web' && <View style={s.homeIndicator} />}</View>;
}
export const textStyles = StyleSheet.create({ heading: { color: c.ink, fontSize: 28, lineHeight: 32, fontWeight: '600' }, body: { color: c.muted, fontSize: 14, lineHeight: 20 }, label: { color: c.blue, fontSize: 11, lineHeight: 14, fontWeight: '600' } });
const s = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: c.white, maxWidth: 430, width: '100%', alignSelf: 'center' },
  body: { flex: 1, minHeight: 0 }, content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 }, scrollContent: { flexGrow: 1 },
  primaryButton: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c.blue, width: '100%' }, lightButton: { backgroundColor: c.white }, primaryText: { color: c.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.line, backgroundColor: c.white, width: '100%' }, secondaryText: { color: c.ink, fontSize: 15, fontWeight: '600' },
  header: { height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 }, roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.gray, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: c.ink, fontSize: 16, fontWeight: '600' },
  progress: { width: 96, height: 5, borderRadius: 3, backgroundColor: c.line, marginTop: 18, marginBottom: 18 }, progressFill: { height: 5, borderRadius: 3, backgroundColor: c.blue }, step: { color: c.blue, fontSize: 12, lineHeight: 13, fontWeight: '600', marginBottom: 18 },
  tag: { backgroundColor: c.gray, borderRadius: 16, height: 32, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, tagText: { fontSize: 12, color: c.ink, fontWeight: '500' },
  match: { minWidth: 78, height: 32, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 17 }, matchText: { color: c.ink, fontSize: 12, fontWeight: '700' },
  foodCard: { borderRadius: 20, backgroundColor: c.light, padding: 15 }, preferenceCard: { minHeight: 254, borderRadius: 26, backgroundColor: c.light, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 20 },
  navArea: { height: 88, alignItems: 'center', paddingTop: 5, gap: 8 }, nav: { width: 246, height: 58, borderRadius: 29, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: c.black, flexDirection: 'row', justifyContent: 'space-between' }, navItem: { width: 48, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }, navActive: { backgroundColor: c.white }, homeIndicator: { width: 118, height: 4, borderRadius: 2, backgroundColor: c.black },
});
