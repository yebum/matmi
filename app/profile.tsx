import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AllergenSelector } from '../src/components/AllergenSelector';
import { ComfortSlider } from '../src/components/ComfortSlider';
import { Screen, TagChip } from '../src/components/UI';
import { allergenLabel, foodCultures, sensitivityFields } from '../src/data/personalization';
import { getSupportedFood, type SupportedFood } from '../src/data/supportedFoods';
import { journeySummary } from '../src/features/foodJourney';
import { listMyReviews, type MyReview } from '../src/services/communityReviews';
import { useProfile } from '../src/store/ProfileContext';
import { colors as c } from '../src/theme';

type HistoryTab = 'Tried' | 'Reviews' | 'Saved';
const likeOptions = ['Fried food', 'Cheese', 'Beef', 'Crispy', 'Spicy'];
const summaryKeys = ['spicy', 'unfamiliarTexture', 'organMeat'] as const;

export default function MyMatmi() {
  const router = useRouter();
  const { profile, culture, setCulture, setSensitivity, toggleAllergen, toggleLike, toggleAvoid,
    triedFoodIds, myReviewIds, savedDishIds } = useProfile();
  const [tab, setTab] = useState<HistoryTab>('Tried');
  const [editing, setEditing] = useState(false);
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [reviewsState, setReviewsState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [retry, setRetry] = useState(0);
  const metrics = journeySummary({ triedFoodIds, myReviewIds });
  const selectedCulture = foodCultures.find(item => item.value === culture) ?? foodCultures[0];
  const reviewIdsKey = myReviewIds.join(',');

  useEffect(() => {
    if (tab !== 'Reviews') return;
    if (myReviewIds.length === 0) { setReviews([]); setReviewsState('ready'); return; }
    let active = true;
    setReviewsState('loading');
    listMyReviews(myReviewIds).then(items => {
      if (active) { setReviews(items); setReviewsState('ready'); }
    }).catch(() => { if (active) setReviewsState('error'); });
    return () => { active = false; };
  }, [tab, reviewIdsKey, retry]);

  const openFood = (id: string) => router.push({ pathname: '/food/[id]', params: { id } });
  const foodRow = (food: SupportedFood) => <Pressable key={food.id} accessibilityRole="button" accessibilityLabel={`Open ${food.name}, ${food.country}`} onPress={() => openFood(food.id)} style={s.foodRow}>
    <Text numberOfLines={1} style={s.foodName}>{food.name}</Text><Text numberOfLines={1} style={s.country}>{food.country} ›</Text>
  </Pressable>;
  const foodsFor = (ids: string[]) => [...new Set(ids)].map(getSupportedFood).filter((food): food is SupportedFood => !!food);

  return <Screen nav="profile" scroll contentStyle={s.content}>
    <Text style={s.title}>My MATMI</Text>
    <Text style={s.subtitle}>Your food journey so far</Text>
    <View style={s.summaryCard} accessibilityLabel={`${metrics.foodsTried} foods tried, ${metrics.countries} countries, ${metrics.reviewsShared} reviews shared`}>
      <View style={s.metric}><Text style={s.metricValue}>{metrics.foodsTried}</Text><Text style={s.metricLabel}>Foods</Text></View>
      <View style={s.metric}><Text style={s.metricValue}>{metrics.countries}</Text><Text style={s.metricLabel}>Countries</Text></View>
      <View style={s.metric}><Text style={s.metricValue}>{metrics.reviewsShared}</Text><Text style={s.metricLabel}>Reviews</Text></View>
    </View>
    <Text style={s.sectionTitle}>FOOD HISTORY</Text>
    <View style={s.tabs} accessibilityRole="tablist">
      {(['Tried', 'Reviews', 'Saved'] as const).map(item => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => setTab(item)} style={[s.tab, tab === item && s.activeTab]}><Text style={[s.tabText, tab === item && s.activeTabText]}>{item}</Text></Pressable>)}
    </View>
    <View style={s.historyCard}>
      {tab === 'Tried' && (foodsFor(triedFoodIds).length ? foodsFor(triedFoodIds).map(foodRow) : <View style={s.empty}><Text style={s.emptyText}>No foods tried yet.</Text><Pressable accessibilityRole="button" onPress={() => router.push('/scanner')}><Text style={s.link}>Scan your first menu →</Text></Pressable></View>)}
      {tab === 'Saved' && (foodsFor(savedDishIds).length ? foodsFor(savedDishIds).map(foodRow) : <View style={s.empty}><Text style={s.emptyText}>No saved foods yet.</Text><Pressable accessibilityRole="button" onPress={() => router.push('/scanner')}><Text style={s.link}>Explore foods →</Text></Pressable></View>)}
      {tab === 'Reviews' && (reviewsState === 'loading' ? <Text style={s.status}>Loading experiences…</Text>
        : reviewsState === 'error' ? <View style={s.empty}><Text style={s.emptyText}>Reviews temporarily unavailable.</Text><Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)}><Text style={s.link}>Retry →</Text></Pressable></View>
        : reviews.length ? reviews.map(review => {
          const food = getSupportedFood(review.foodId);
          if (!food) return null;
          return <View key={review.id} style={s.reviewRow}><Text style={s.reviewFood}>{food.name.toLocaleUpperCase()} · {food.country.toLocaleUpperCase()}</Text><Text numberOfLines={2} style={s.reviewQuote}>“{review.remindedOf}”</Text><Text style={s.reviewScore}>Liked it · {review.likingScore} / 10</Text></View>;
        }) : <View style={s.empty}><Text style={s.emptyText}>No experiences shared yet.</Text><Text style={s.status}>Your reviews help the next traveler.</Text></View>)}
    </View>
    <View style={s.profileCard}>
      <View style={s.cardHeader}><Text style={s.sectionTitle}>TASTE PROFILE</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: editing }} onPress={() => setEditing(value => !value)}><Text style={s.link}>{editing ? 'Done' : 'Edit profile →'}</Text></Pressable></View>
      <Text style={s.culture}>{selectedCulture.label} culture</Text>
      {!editing ? <>
        {summaryKeys.map(key => {
          const field = sensitivityFields.find(item => item.key === key)!;
          return <View key={key} style={s.preferenceRow}><Text style={s.preferenceLabel}>{field.shortLabel}</Text><Text style={s.preferenceValue}>{profile.sensitivities[key]} / 10</Text></View>;
        })}
        <View style={s.allergySummary}><Text style={s.preferenceLabel}>Allergies</Text><Text style={s.allergyText}>{profile.allergens.length ? profile.allergens.map(allergenLabel).join(' · ') : 'None selected'}</Text></View>
      </> : <View style={s.editPanel}>
        <Text style={s.editHeading}>FAMILIAR FOOD CULTURE</Text><View style={s.chips}>{foodCultures.map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: culture === item.value }} onPress={() => setCulture(item.value)}><TagChip title={item.label} blue={culture === item.value} /></Pressable>)}</View>
        {sensitivityFields.map(field => <ComfortSlider key={field.key} label={field.label} explanation={field.explanation} low={field.low} high={field.high} value={profile.sensitivities[field.key]} onChange={value => setSensitivity(field.key, value)} />)}
        <Text style={s.editHeading}>ALLERGIES TO FLAG</Text><AllergenSelector selected={profile.allergens} onToggle={toggleAllergen} /><Text style={s.disclaimer}>Recipes vary by restaurant. Always confirm allergies with the restaurant.</Text>
        <Text style={s.editHeading}>LIKES</Text><View style={s.chips}>{likeOptions.map(item => <Pressable accessibilityRole="button" accessibilityState={{ selected: profile.likes.includes(item) }} key={item} onPress={() => toggleLike(item)}><TagChip title={item} lime={profile.likes.includes(item)} /></Pressable>)}</View>
        <Text style={s.editHeading}>OTHER AVOIDS</Text><View style={s.chips}>{[...new Set([...profile.avoids, 'Strong fish smell'])].map(item => <Pressable accessibilityRole="button" accessibilityState={{ selected: profile.avoids.includes(item) }} key={item} onPress={() => toggleAvoid(item)}><TagChip title={`${profile.avoids.includes(item) ? '✓ ' : ''}${item}`} blue={profile.avoids.includes(item)} /></Pressable>)}</View>
      </View>}
    </View>
    <View style={s.about}><Text style={s.aboutTitle}>ABOUT MATMI</Text><Text style={s.aboutText}>Taste the world, one dish at a time.</Text></View>
  </Screen>;
}

const s = StyleSheet.create({
  content: { paddingBottom: 32 }, title: { color: c.ink, fontSize: 28, lineHeight: 36, fontWeight: '700', marginTop: 5 }, subtitle: { color: c.muted, fontSize: 13, marginTop: 2, marginBottom: 19 },
  summaryCard: { backgroundColor: c.lavender, borderRadius: 23, paddingVertical: 20, flexDirection: 'row', marginBottom: 24 }, metric: { flex: 1, alignItems: 'center', minWidth: 0 }, metricValue: { color: c.blue, fontSize: 29, lineHeight: 34, fontWeight: '700' }, metricLabel: { color: c.ink, fontSize: 11, marginTop: 3 },
  sectionTitle: { color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 }, tabs: { flexDirection: 'row', backgroundColor: c.gray, borderRadius: 16, padding: 4, gap: 4 }, tab: { flex: 1, minWidth: 0, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, activeTab: { backgroundColor: c.blue }, tabText: { color: c.ink, fontSize: 13, fontWeight: '600' }, activeTabText: { color: c.white },
  historyCard: { minHeight: 88, backgroundColor: c.light, borderRadius: 19, paddingHorizontal: 15, paddingVertical: 5, marginTop: 9, marginBottom: 24 }, foodRow: { minHeight: 54, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 8 }, foodName: { flex: 1, minWidth: 0, color: c.ink, fontSize: 15, fontWeight: '600' }, country: { flexShrink: 1, color: c.muted, fontSize: 12 },
  empty: { minHeight: 78, justifyContent: 'center', gap: 6, paddingVertical: 11 }, emptyText: { color: c.ink, fontSize: 13, fontWeight: '500' }, link: { color: c.blue, fontSize: 12, fontWeight: '700' }, status: { color: c.muted, fontSize: 12, lineHeight: 18, paddingVertical: 10 }, reviewRow: { minHeight: 96, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.line }, reviewFood: { color: c.blue, fontSize: 10, fontWeight: '700' }, reviewQuote: { color: c.ink, fontSize: 13, lineHeight: 18, marginTop: 6 }, reviewScore: { color: c.muted, fontSize: 11, marginTop: 5 },
  profileCard: { backgroundColor: c.light, borderRadius: 22, padding: 17, marginBottom: 14 }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }, culture: { color: c.ink, fontSize: 15, fontWeight: '600', marginBottom: 14 }, preferenceRow: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 29, gap: 8 }, preferenceLabel: { color: c.ink, fontSize: 13 }, preferenceValue: { color: c.blue, fontSize: 13, fontWeight: '700' }, allergySummary: { borderTopWidth: 1, borderTopColor: c.line, paddingTop: 11, marginTop: 5, gap: 4 }, allergyText: { color: c.muted, fontSize: 12, lineHeight: 18 },
  editPanel: { gap: 11 }, editHeading: { color: c.muted, fontSize: 10, fontWeight: '700', marginTop: 10 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, disclaimer: { color: c.muted, fontSize: 11, lineHeight: 16 }, about: { paddingVertical: 11, borderTopWidth: 1, borderTopColor: c.line }, aboutTitle: { color: c.muted, fontSize: 10, fontWeight: '700', marginBottom: 4 }, aboutText: { color: c.ink, fontSize: 12 },
});
