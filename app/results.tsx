import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import HintDot from '../assets/figma/hint-dot.svg';
import { FoodCard, MatchBadge, PageHeader, PrimaryButton, Screen, SecondaryButton, TagChip } from '../src/components/UI';
import { useMenuImageInput } from '../src/components/MenuImageInput';
import { useProfile } from '../src/store/ProfileContext';
import { colors as c } from '../src/theme';
import { AllergenWarning } from '../src/components/AllergenWarning';
import { allergenWarning } from '../src/features/tasteMatch';

export default function Results() {
  const router = useRouter();
  const { detectedFoods, ocrResult, matchFor, setSelectedDishId } = useProfile();
  const picker = useMenuImageInput(() => router.push('/scanner'));
  const [showMore, setShowMore] = useState(false);
  const ranked = [...detectedFoods].sort((a, b) => matchFor(b).score - matchFor(a).score);
  const featured = ranked[0];
  const open = (id: string) => { setSelectedDishId(id); router.push({ pathname: '/food/[id]', params: { id } }); };
  return <Screen nav="camera" scroll>{picker.inputs}<PageHeader title="Menu results" onBack={() => router.push('/scanner')} />
    {!ocrResult ? <View style={s.empty}><Text style={s.title}>No scan results yet</Text><Text style={s.subtitle}>Choose a menu photo to find supported dishes.</Text><PrimaryButton title="Choose a photo" onPress={picker.openUpload} /></View> : !featured ? <View style={s.empty}><Text style={s.title}>No supported dishes found</Text><Text style={s.subtitle}>We couldn’t find one of the five supported prototype dishes in this photo. Try a clearer, closer image.</Text><SecondaryButton title="Try another photo" onPress={() => router.push('/scanner')} /><View style={{ height: 10 }} /><PrimaryButton title="Upload another image" onPress={picker.openUpload} />{picker.error && <Text style={s.error}>{picker.error}</Text>}</View> : <>
      <Text style={s.title}>We found {ranked.length} {ranked.length === 1 ? 'dish' : 'dishes'}</Text><Text style={s.subtitle}>Start with the dishes that feel closest to your taste.</Text>
      <FoodCard onPress={() => open(featured.id)} style={s.featured}><AllergenWarning conflicts={matchFor(featured).allergenConflicts} /><View style={s.row}><View style={s.nameBlock}><Text style={s.featuredName}>{featured.name}</Text><Text style={s.featuredSubtitle}>{featured.country} · {featured.subtitle}</Text></View><MatchBadge score={matchFor(featured).score} full /></View><View style={s.tags}>{[...featured.tasteTags, ...featured.textureTags].slice(0, 3).map((tag, index) => <TagChip key={tag} title={tag} blue={index === 0} />)}</View><View style={s.hint}><HintDot width={8} height={8} /><Text style={s.hintText}>{matchFor(featured).warnings[0] ?? featured.comparisons.default}</Text></View></FoodCard>
      {ranked.slice(1, showMore ? undefined : 3).map(food => <FoodCard key={food.id} onPress={() => open(food.id)} style={s.compact}><View style={s.compactCopy}><Text style={s.compactName}>{food.name}</Text><Text style={s.compactSubtitle}>{food.country} · {food.tasteTags[0]} · {food.textureTags[0]}</Text>{matchFor(food).allergenConflicts.length > 0 ? <Text style={s.warning}>⚠ {allergenWarning(matchFor(food).allergenConflicts)}</Text> : matchFor(food).warnings.length > 0 && <Text style={s.warning}>Check ingredients</Text>}</View><MatchBadge score={matchFor(food).score} /></FoodCard>)}
      {ranked.length > 3 && <Pressable accessibilityRole="button" onPress={() => setShowMore(!showMore)} style={s.more}><Text style={s.moreText}>{showMore ? 'Show fewer dishes' : `See ${ranked.length - 3} more dishes`}</Text></Pressable>}
      {ranked.length > 1 && <View style={s.compareAction}><SecondaryButton title="Compare top dishes" onPress={() => router.push('/compare')} /></View>}
      <Text style={s.scope}>Prototype supports 5 selected dishes.</Text>
    </>}
  </Screen>;
}
const s = StyleSheet.create({ title: { color: c.ink, fontSize: 25, lineHeight: 29, fontWeight: '600', marginTop: 16, marginBottom: 5 }, subtitle: { color: c.muted, fontSize: 13, lineHeight: 18, marginBottom: 24 }, empty: { paddingTop: 36 }, error: { color: '#B85037', fontSize: 12, marginTop: 12 }, featured: { minHeight: 154, backgroundColor: c.lavender, borderRadius: 24, padding: 16, marginBottom: 14 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, nameBlock: { flex: 1 }, featuredName: { color: c.ink, fontSize: 18, lineHeight: 23, fontWeight: '600' }, featuredSubtitle: { color: c.muted, fontSize: 11, lineHeight: 14 }, tags: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }, hint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }, hintText: { color: c.ink, fontSize: 11, lineHeight: 14, flex: 1 }, compact: { minHeight: 90, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, compactCopy: { gap: 4, flex: 1 }, compactName: { color: c.ink, fontSize: 16, lineHeight: 21, fontWeight: '600' }, compactSubtitle: { color: c.muted, fontSize: 11, lineHeight: 14 }, warning: { color: '#B85037', fontSize: 10 }, more: { height: 42, borderRadius: 14, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }, moreText: { fontSize: 12, fontWeight: '500', color: c.ink }, compareAction: { marginTop: 14 }, scope: { color: c.muted, fontSize: 11, textAlign: 'center', marginTop: 20 } });
