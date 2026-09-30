import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ComfortSlider } from '../../src/components/ComfortSlider';
import { PageHeader, Screen } from '../../src/components/UI';
import { getSupportedFood } from '../../src/data/supportedFoods';
import { emptyReviewDraft, validateReview, type ReviewDraft } from '../../src/features/communityLens';
import { submitCommunityReview } from '../../src/services/communityReviews';
import { useProfile } from '../../src/store/ProfileContext';
import { colors as c } from '../../src/theme';

export default function ReviewFood() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const food = getSupportedFood(id);
  const { culture } = useProfile();
  const [draft, setDraft] = useState<ReviewDraft>(emptyReviewDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inFlight = useRef(false);
  if (!food) return <Screen><PageHeader title="Share experience" onBack={() => router.back()} /><Text>Dish unavailable.</Text></Screen>;
  const update = <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) => { setDraft(current => ({ ...current, [key]: value })); setError(null); };
  const submit = async () => {
    if (inFlight.current) return;
    const validation = validateReview(food.id, culture, draft);
    if (validation) { setError(validation); return; }
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await submitCommunityReview(food.id, culture, draft);
      setDraft(emptyReviewDraft());
      setSuccess(true);
    } catch {
      setError('Could not save your experience. Check your connection and try again. Your answers are still here.');
    } finally { inFlight.current = false; setSubmitting(false); }
  };
  return <Screen scroll contentStyle={s.content}>
    <PageHeader title="Share experience" onBack={() => router.back()} />
    <Text style={s.eyebrow}>COMMUNITY LENS · {food.name.toLocaleUpperCase()}</Text>
    <Text style={s.title}>{success ? 'Thanks for sharing.' : 'What did it feel like to you?'}</Text>
    {success ? <><Text style={s.intro}>Your experience is saved. Return to Food Lens to see the updated community perspective.</Text><Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/food/[id]', params: { id: food.id } })} style={s.button}><Text style={s.buttonText}>Back to Food Lens</Text></Pressable></> : <>
      <Text style={s.intro}>Your {culture.toLowerCase()} perspective is shared anonymously. Please avoid names or contact details.</Text>
      <Text style={s.label}>What did it remind you of?</Text>
      <TextInput accessibilityLabel="What did it remind you of?" value={draft.remindedOf} onChangeText={value => update('remindedOf', value)} maxLength={160} placeholder="A familiar food, flavor, or moment…" placeholderTextColor={c.muted} multiline style={s.input} />
      <Text style={s.counter}>{draft.remindedOf.length} / 160</Text>
      <Text style={s.label}>How would you describe it to someone from your culture?</Text>
      <TextInput accessibilityLabel="How would you describe it to someone from your culture?" value={draft.culturalDescription} onChangeText={value => update('culturalDescription', value)} maxLength={240} placeholder="Describe the taste in your own words…" placeholderTextColor={c.muted} multiline style={[s.input, s.longInput]} />
      <Text style={s.counter}>{draft.culturalDescription.length} / 240</Text>
      <ComfortSlider label="Familiarity" explanation="How familiar did it feel?" low="New to me" high="Very familiar" value={draft.familiarityScore} onChange={value => update('familiarityScore', value)} />
      <ComfortSlider label="Liking" explanation="How much did you enjoy it?" low="Not for me" high="Loved it" value={draft.likingScore} onChange={value => update('likingScore', value)} />
      <ComfortSlider label="MATMI accuracy" explanation="How close was MATMI's description?" low="Not close" high="Spot on" value={draft.matmiAccuracyScore} onChange={value => update('matmiAccuracyScore', value)} />
      {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: submitting }} disabled={submitting} onPress={submit} style={[s.button, submitting && s.disabled]}>{submitting ? <ActivityIndicator color={c.white} /> : <Text style={s.buttonText}>Share anonymously</Text>}</Pressable>
    </>}
  </Screen>;
}

const s = StyleSheet.create({
  content: { paddingBottom: 36 }, eyebrow: { color: c.blue, fontSize: 11, fontWeight: '700', marginTop: 22, marginBottom: 7 },
  title: { color: c.ink, fontSize: 26, lineHeight: 32, fontWeight: '600', marginBottom: 10 },
  intro: { color: c.muted, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  label: { color: c.ink, fontSize: 14, lineHeight: 20, fontWeight: '600', marginBottom: 8 },
  input: { minHeight: 78, borderRadius: 17, borderWidth: 1, borderColor: c.line, backgroundColor: c.white, color: c.ink, fontSize: 14, lineHeight: 20, padding: 14, textAlignVertical: 'top' },
  longInput: { minHeight: 106 }, counter: { color: c.muted, textAlign: 'right', fontSize: 11, marginTop: 5, marginBottom: 18 },
  error: { color: '#B85037', fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 10 },
  button: { minHeight: 56, borderRadius: 18, backgroundColor: c.blue, alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 12 },
  buttonText: { color: c.white, fontSize: 15, fontWeight: '600' }, disabled: { opacity: 0.65 },
});
