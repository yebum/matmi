import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FoodCulture } from '../data/personalization';
import { summarizeCommunity, type ExperienceReview } from '../features/communityLens';
import { listCommunityReviews } from '../services/communityReviews';
import { colors as c } from '../theme';

export function CommunityLens({ foodId, culture, onShare }: { foodId: string; culture: FoodCulture; onShare: () => void }) {
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useFocusEffect(useCallback(() => {
    let active = true;
    setStatus('loading');
    listCommunityReviews(foodId, culture).then(items => { if (active) { setReviews(items); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [foodId, culture]));
  const summary = summarizeCommunity(reviews, foodId, culture);
  return <View style={s.card}>
    <Text style={s.eyebrow}>COMMUNITY LENS</Text>
    <Text style={s.title}>A familiar point of view</Text>
    {status === 'loading' ? <View style={s.state}><ActivityIndicator color={c.blue} /><Text style={s.muted}>Loading community experiences…</Text></View>
      : status === 'error' ? <Text style={s.muted}>Community experiences are temporarily unavailable. Your Food Lens is still ready to explore.</Text>
      : summary.count === 0 ? <Text style={s.muted}>Be the first {culture.toLowerCase()} traveler to share a perspective on this dish.</Text>
      : <>
        <Text style={s.count}>{culture} {summary.demo ? 'demo examples' : 'travelers'} · {summary.count} review{summary.count === 1 ? '' : 's'}</Text>
        {summary.demo && <Text style={s.demo}>Prototype examples only — not verified traveler feedback.</Text>}
        {summary.count < 3 && <Text style={s.muted}>Early community signal from a small sample.</Text>}
        {summary.count >= 3 && <Text style={s.muted}>Common comparisons from {culture.toLowerCase()} {summary.demo ? 'demo examples' : 'reviewers'}.</Text>}
        <View style={s.metrics}>
          <Metric label="Familiarity" value={summary.familiarity} />
          <Metric label="Liking" value={summary.liking} />
          <Metric label="MATMI fit" value={summary.accuracy} />
        </View>
        {summary.quotes.map((quote, index) => <View style={s.quote} key={`${index}-${quote}`}><Text style={s.quoteText}>“{quote}”</Text></View>)}
      </>}
    <Pressable accessibilityRole="button" onPress={onShare} style={s.share}><Text style={s.shareText}>Tried this? Share your experience</Text></Pressable>
  </View>;
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return <View style={s.metric}><Text style={s.metricValue}>{value?.toFixed(1) ?? '—'}</Text><Text style={s.metricLabel}>{label} / 10</Text></View>;
}

const s = StyleSheet.create({
  card: { borderRadius: 22, backgroundColor: c.light, padding: 16, marginBottom: 13, gap: 9 },
  eyebrow: { color: c.blue, fontSize: 11, fontWeight: '700' }, title: { color: c.ink, fontSize: 17, lineHeight: 23, fontWeight: '600' },
  state: { flexDirection: 'row', alignItems: 'center', gap: 8 }, muted: { color: c.muted, fontSize: 12, lineHeight: 18 },
  count: { color: c.ink, fontSize: 12, fontWeight: '600' }, demo: { color: c.blue, fontSize: 11, lineHeight: 16 },
  metrics: { flexDirection: 'row', gap: 6, marginTop: 2 }, metric: { flex: 1, minWidth: 0, borderRadius: 13, padding: 8, backgroundColor: c.paleLime },
  metricValue: { color: c.ink, fontSize: 17, fontWeight: '700' }, metricLabel: { color: c.muted, fontSize: 9, lineHeight: 13 },
  quote: { backgroundColor: c.white, borderRadius: 13, padding: 11 }, quoteText: { color: c.ink, fontSize: 12, lineHeight: 18 },
  share: { minHeight: 44, borderRadius: 13, backgroundColor: c.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, marginTop: 4 },
  shareText: { color: c.white, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
