import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AllergenSelector } from '../src/components/AllergenSelector';
import { ComfortSlider } from '../src/components/ComfortSlider';
import { PageHeader, PrimaryButton, Screen, SetupProgress, textStyles } from '../src/components/UI';
import { sensitivityFields } from '../src/data/personalization';
import { useProfile } from '../src/store/ProfileContext';
import { colors as c } from '../src/theme';

export default function Preference() {
  const router = useRouter();
  const { profile, setSensitivity, toggleAllergen, resetPersonalization, completeOnboarding } = useProfile();
  const finish = () => { completeOnboarding(); router.replace('/home'); };
  return <Screen contentStyle={s.root}><PageHeader title="Set up" onBack={() => router.back()} /><SetupProgress step={2} /><Text style={[textStyles.heading, s.title]}>Set your food comfort level</Text><Text style={[textStyles.body, s.description]}>Adjust what feels comfortable to you. You can change this anytime.</Text><View style={s.sliders}>{sensitivityFields.map(field => <ComfortSlider key={field.key} label={field.label} explanation={field.explanation} low={field.low} high={field.high} value={profile.sensitivities[field.key]} onChange={value => setSensitivity(field.key, value)} />)}</View><View style={s.allergies}><Text style={s.sectionTitle}>Allergies to flag</Text><Text style={s.sectionCopy}>We’ll flag dishes that commonly contain these ingredients.</Text><AllergenSelector selected={profile.allergens} onToggle={toggleAllergen} /><Text style={s.disclaimer}>Recipes vary by restaurant. Always confirm allergies with the restaurant.</Text></View><View style={s.action}><PrimaryButton title="Save & continue" onPress={finish} /><Pressable accessibilityRole="button" onPress={() => { resetPersonalization(); finish(); }} style={s.skip}><Text style={s.skipText}>Skip for now</Text></Pressable></View></Screen>;
}
const s = StyleSheet.create({ root: { paddingBottom: 24 }, title: { marginBottom: 10 }, description: { marginBottom: 22 }, sliders: { backgroundColor: c.light, borderRadius: 26, padding: 10, marginBottom: 18 }, allergies: { borderRadius: 24, backgroundColor: c.light, padding: 18 }, sectionTitle: { color: c.ink, fontSize: 18, fontWeight: '600' }, sectionCopy: { color: c.muted, fontSize: 12, lineHeight: 17, marginTop: 6, marginBottom: 16 }, disclaimer: { color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 16 }, action: { paddingTop: 22 }, skip: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, skipText: { color: c.muted, fontSize: 13, fontWeight: '500' } });
