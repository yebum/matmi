import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { foodById } from './data/foods';
import type { CulturalExplanation, MenuItemCandidate, UserTasteProfile } from './models/food';
import { userTasteProfileSchema } from './models/food';
import { scanMenu } from './services/ocr';
import { calculateTasteMatch } from './services/taste/match';
import { MockCulturalTranslationService } from './services/ai/cultural';

type Screen = 'welcome' | 'culture' | 'taste' | 'home' | 'menu' | 'result';
const STORAGE_KEY = 'ai-food-lens-profile-v1';
const cultures = ['Korean', 'Japanese', 'American', 'Chinese', 'French', 'Hungarian'];
const tasteOptions = ['Spicy', 'Sweet', 'Savory', 'Sour', 'Rich', 'Mild'];
const textureOptions = ['Crispy', 'Chewy', 'Soft', 'Creamy', 'Crunchy'];
const ingredientOptions = ['Beef', 'Pork', 'Chicken', 'Seafood', 'Cheese', 'Fried food'];
const avoidOptions = ['Organ meat', 'Raw seafood', 'Strong fish smell'];
const initialProfile: UserTasteProfile = { preferredLanguage: 'English', familiarFoodCulture: 'Korean', likes: [], dislikes: [], preferredTasteTags: [], preferredTextureTags: [], avoidIngredients: [] };

function toggle(values: string[], value: string): string[] {
  const lower = value.toLowerCase();
  return values.includes(lower) ? values.filter(item => item !== lower) : [...values, lower];
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>;
}

function Button({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary, disabled && styles.buttonDisabled]}><Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text><Text style={[styles.buttonArrow, secondary && styles.buttonTextSecondary]}>→</Text></Pressable>;
}

function StepHeader({ step, title, description, onBack }: { step: string; title: string; description?: string; onBack?: () => void }) {
  return <View style={styles.stepHeader}><View style={styles.topLine}><Text style={styles.brandSmall}>◉  MATMI</Text><Text style={styles.stepLabel}>{step}</Text></View>{onBack && <Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>←  Back</Text></Pressable>}<Text style={styles.title}>{title}</Text>{description && <Text style={styles.description}>{description}</Text>}</View>;
}

export function FoodLensApp() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [profile, setProfile] = useState<UserTasteProfile>(initialProfile);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<MenuItemCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<CulturalExplanation | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved) { const parsed = userTasteProfileSchema.safeParse(JSON.parse(saved)); if (parsed.success) { setProfile(parsed.data); setScreen('home'); } }
    }).catch(() => setError('Saved preferences could not be loaded. You can continue with a new profile.')).finally(() => setReady(true));
  }, []);

  const saveProfile = async () => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); setScreen('home'); setError(''); }
    catch { setError('Could not save preferences on this device. You can still continue.'); setScreen('home'); }
  };

  const processMenu = async (uri: string) => {
    setBusy(true); setError(''); setImageUri(uri);
    try { const found = await scanMenu(uri); setCandidates(found); setScreen('menu'); }
    catch { setError('We could not read the sample menu. Please try again.'); }
    finally { setBusy(false); }
  };

  const pickImage = async (camera: boolean) => {
    setError('');
    try {
      const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets[0]?.uri) await processMenu(result.assets[0].uri);
    } catch { setError('Could not open photos or camera. Try the sample menu instead.'); }
  };

  const selectFood = async (id: string) => {
    const food = foodById(id); if (!food) return;
    setBusy(true); setError(''); setSelectedId(id);
    try { setExplanation(await new MockCulturalTranslationService().generateCulturalExplanation(food, profile)); setScreen('result'); }
    catch { setError('Could not create the food explanation. Please try again.'); }
    finally { setBusy(false); }
  };

  const food = selectedId ? foodById(selectedId) : undefined;
  const match = food ? calculateTasteMatch(food, profile) : undefined;

  if (!ready) return <SafeAreaView style={styles.loading}><ActivityIndicator color="#155d4d" size="large" /></SafeAreaView>;
  return <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" backgroundColor="#f8f7f2" /><View style={styles.shell}><ScrollView contentContainerStyle={styles.scroll}>
    {error ? <Pressable onPress={() => setError('')} style={styles.error}><Text style={styles.errorText}>{error}  ×</Text></Pressable> : null}

    {screen === 'welcome' && <View style={styles.welcome}><View style={styles.heroArt}><View style={styles.heroCircle}><Text style={styles.heroGlyph}>◉</Text></View><Text style={styles.heroCorner}>01 / THE FOOD EXPERIENCE</Text><Text style={styles.heroDish}>GULYÁS  ·  LÁNGOS  ·  HURKA</Text></View><Text style={styles.eyebrow}>THE WORLD IS ON THE MENU</Text><Text style={styles.welcomeTitle}>{'Eat curious.\nOrder confident.'}</Text><Text style={styles.lead}>Turn unfamiliar food into a familiar experience, tailored to your taste.</Text><Button label="Get started" onPress={() => setScreen('culture')} /><Text style={styles.footnote}>Built for the moments when the menu needs more than a translation.</Text></View>}

    {screen === 'culture' && <><StepHeader step="01 / 03" title="What food culture feels like home?" description="We’ll use familiar experiences to help you picture new dishes." onBack={() => setScreen('welcome')} /><Text style={styles.sectionLabel}>CHOOSE ONE</Text><View style={styles.cultureGrid}>{cultures.map(culture => <Pressable key={culture} onPress={() => setProfile({ ...profile, familiarFoodCulture: culture })} style={[styles.cultureCard, profile.familiarFoodCulture === culture && styles.cultureCardSelected]}><Text style={[styles.cultureText, profile.familiarFoodCulture === culture && styles.cultureTextSelected]}>{culture}</Text><Text style={styles.cultureCheck}>{profile.familiarFoodCulture === culture ? '●' : '○'}</Text></Pressable>)}</View><View style={styles.bottomButton}><Button label="Continue" onPress={() => setScreen('taste')} /></View></>}

    {screen === 'taste' && <><StepHeader step="02 / 03" title="Make it your kind of food." description="A few quick picks make every recommendation more useful." onBack={() => setScreen('culture')} /><Text style={styles.sectionLabel}>FLAVORS YOU ENJOY</Text><View style={styles.chipRow}>{tasteOptions.map(v => <Chip key={v} label={v} selected={profile.preferredTasteTags.includes(v.toLowerCase())} onPress={() => setProfile({ ...profile, preferredTasteTags: toggle(profile.preferredTasteTags, v) })} />)}</View><Text style={styles.sectionLabel}>TEXTURES YOU ENJOY</Text><View style={styles.chipRow}>{textureOptions.map(v => <Chip key={v} label={v} selected={profile.preferredTextureTags.includes(v.toLowerCase())} onPress={() => setProfile({ ...profile, preferredTextureTags: toggle(profile.preferredTextureTags, v) })} />)}</View><Text style={styles.sectionLabel}>FOODS YOU LIKE</Text><View style={styles.chipRow}>{ingredientOptions.map(v => <Chip key={v} label={v} selected={profile.likes.includes(v.toLowerCase())} onPress={() => setProfile({ ...profile, likes: toggle(profile.likes, v) })} />)}</View><Text style={styles.sectionLabel}>RATHER AVOID</Text><View style={styles.chipRow}>{avoidOptions.map(v => <Chip key={v} label={v} selected={profile.dislikes.includes(v.toLowerCase())} onPress={() => setProfile({ ...profile, dislikes: toggle(profile.dislikes, v) })} />)}</View><View style={styles.bottomButton}><Button label="Save my taste" onPress={saveProfile} /></View></>}

    {screen === 'home' && <><View style={styles.topLine}><Text style={styles.brandSmall}>◉  MATMI</Text><Pressable onPress={() => setScreen('taste')}><Text style={styles.edit}>Edit taste  ↗</Text></Pressable></View><View style={styles.homeHeading}><Text style={styles.eyebrow}>YOUR TABLE, ANYWHERE</Text><Text style={styles.title}>{'Know the dish\nbefore the first bite.'}</Text><Text style={styles.description}>Point your camera at a menu. We’ll help you decide what sounds good.</Text></View><View style={styles.cameraFrame}><View style={styles.cameraInner}><Text style={styles.cameraIcon}>⌗</Text><Text style={styles.cameraText}>Your next favorite dish starts here</Text></View><Text style={styles.frameCorner}>MENU MODE  /  HUNGARY</Text></View><Button label="Scan a menu" onPress={() => pickImage(true)} disabled={busy} /><View style={styles.buttonGap}><Button label="Upload photo" onPress={() => pickImage(false)} secondary disabled={busy} /></View><Pressable style={styles.demoLink} onPress={() => processMenu('mock://hungarian-menu')} disabled={busy}><Text style={styles.demoText}>Try the sample Hungarian menu  →</Text></Pressable><Text style={styles.infoText}>Prototype note: image selection works, while dish text is currently read from a sample menu.</Text></>}

    {screen === 'menu' && <><StepHeader step="03 / 03" title="We found these dishes." description="Choose one to see how it might taste to you." onBack={() => setScreen('home')} />{imageUri && !imageUri.startsWith('mock:') ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: 150, borderRadius: 5, marginBottom: 12 }} /> : <View style={styles.sampleBanner}><Text style={styles.sampleBannerText}>◫   SAMPLE MENU  ·  BUDAPEST</Text></View>}{candidates.length === 0 ? <Text style={styles.empty}>No dishes found. Try another image or the sample menu.</Text> : candidates.map((candidate, index) => { const item = candidate.matchedFoodId ? foodById(candidate.matchedFoodId) : undefined; return <Pressable key={`${candidate.rawText}-${index}`} disabled={!item || busy} onPress={() => item && selectFood(item.id)} style={styles.menuRow}><View style={styles.menuRowMain}><Text style={styles.menuNumber}>{String(index + 1).padStart(2, '0')}</Text><View style={styles.menuRowCopy}><Text style={styles.menuName}>{candidate.detectedName}</Text><Text style={styles.menuSubtitle}>{item?.subtitle ?? 'Not in our food guide yet'}</Text></View></View><Text style={styles.rowArrow}>{item ? '↗' : '–'}</Text></Pressable>; })}<Text style={styles.infoText}>Dish names come from our sample OCR data. Recipes and ingredients can vary by restaurant.</Text></>}

    {screen === 'result' && food && match && explanation && <><View style={styles.topLine}><Text style={styles.brandSmall}>◉  MATMI</Text><Text style={styles.stepLabel}>FOOD LENS</Text></View><Pressable onPress={() => setScreen('menu')} style={styles.back}><Text style={styles.backText}>←  All dishes</Text></Pressable><Text style={styles.eyebrow}>🇭🇺  HUNGARY  /  DISCOVERED DISH</Text><Text style={styles.resultTitle}>{food.canonicalName}</Text><Text style={styles.resultSubtitle}>{food.subtitle}</Text><View style={styles.scorePanel}><View><Text style={styles.scoreLabel}>YOUR TASTE MATCH</Text><Text style={styles.scoreNumber}>{match.score}<Text style={styles.scorePercent}>%</Text></Text></View><View style={[styles.scoreBadge, match.score < 50 && styles.scoreBadgeLow]}><Text style={[styles.scoreBadgeText, match.score < 50 && styles.scoreBadgeTextLow]}>{match.score >= 75 ? 'Great fit' : match.score >= 50 ? 'Worth exploring' : 'Think twice'}</Text></View></View><Text style={styles.tagLine}>{[...food.tasteTags.slice(0, 2), ...food.textureTags.slice(0, 2)].map(tag => tag.charAt(0).toUpperCase() + tag.slice(1)).join('  ·  ')}</Text><View style={styles.rule} /><Text style={styles.sectionLabel}>MAKE IT FAMILIAR</Text><Text style={styles.comparison}>{explanation.familiarComparison}</Text><Text style={styles.contextLabel}>THROUGH A {profile.familiarFoodCulture.toUpperCase()} FOOD LENS</Text><View style={styles.rule} /><Text style={styles.sectionLabel}>WHAT IS IT?</Text><Text style={styles.body}>{explanation.summary}</Text><Text style={styles.sensory}>{explanation.tasteExplanation} {explanation.textureExplanation}</Text><View style={styles.rule} /><Text style={styles.sectionLabel}>WHY IT MATCHES YOU</Text>{match.positiveReasons.length ? match.positiveReasons.map(reason => <Text key={reason} style={styles.reason}><Text style={styles.check}>✓  </Text>{reason}</Text>) : <Text style={styles.body}>No positive preference matches for this dish yet.</Text>}{match.warnings.map(warning => <View key={warning} style={styles.warning}><Text style={styles.warningText}>⚠  {warning}</Text></View>)}{explanation.caution && match.warnings.length === 0 ? <Text style={styles.caution}>Note: {explanation.caution}.</Text> : null}{food.allergens.length > 0 && <Text style={styles.allergy}>Traditional versions commonly contain {food.allergens.join(', ')}. Recipes vary. Ask the restaurant if you have an allergy.</Text>}<View style={styles.bottomButton}><Button label="Explore another dish" onPress={() => setScreen('menu')} secondary /></View></>}
  </ScrollView>{busy && <View style={styles.busyOverlay}><ActivityIndicator color="#ffffff" size="large" /><Text style={styles.busyText}>Exploring the menu…</Text></View>}</View></SafeAreaView>;
}

const ink = '#19392f'; const muted = '#65756d'; const bg = '#f8f7f2'; const accent = '#155d4d';
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: bg }, shell: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: bg }, scroll: { padding: 24, paddingTop: Platform.OS === 'web' ? 36 : 16, paddingBottom: 48, flexGrow: 1 }, loading: { flex: 1, justifyContent: 'center', backgroundColor: bg },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brandSmall: { color: ink, fontSize: 12, fontWeight: '800', letterSpacing: 1.8 }, stepLabel: { fontSize: 11, color: muted, fontWeight: '700', letterSpacing: 1.2 },
  welcome: { flex: 1, justifyContent: 'center' }, heroArt: { height: 310, backgroundColor: '#dce9d8', borderRadius: 8, overflow: 'hidden', marginBottom: 32, padding: 24, justifyContent: 'space-between' }, heroCircle: { width: 225, height: 225, borderRadius: 120, backgroundColor: '#f7cd79', borderWidth: 16, borderColor: '#f2e7c9', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-15deg' }], marginTop: -2 }, heroGlyph: { fontSize: 118, color: '#b95335', lineHeight: 135 }, heroCorner: { position: 'absolute', top: 20, left: 20, fontSize: 10, letterSpacing: 1.5, fontWeight: '800', color: ink }, heroDish: { fontSize: 11, letterSpacing: 1.2, fontWeight: '700', color: ink }, eyebrow: { color: accent, fontWeight: '800', fontSize: 11, letterSpacing: 2, marginBottom: 14 }, welcomeTitle: { fontSize: 48, lineHeight: 52, letterSpacing: -2.2, fontWeight: '800', color: ink, marginBottom: 14 }, lead: { color: muted, fontSize: 17, lineHeight: 25, marginBottom: 28, maxWidth: 420 }, footnote: { marginTop: 26, color: muted, fontSize: 12, lineHeight: 18 },
  button: { backgroundColor: accent, borderRadius: 5, height: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#a6b7ad' }, buttonDisabled: { opacity: 0.55 }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }, buttonTextSecondary: { color: ink }, buttonArrow: { color: '#fff', fontSize: 23 }, buttonGap: { marginTop: 10 }, bottomButton: { marginTop: 36 },
  stepHeader: { marginBottom: 28 }, back: { paddingVertical: 25, alignSelf: 'flex-start' }, backText: { color: accent, fontSize: 14, fontWeight: '700' }, title: { color: ink, fontSize: 37, lineHeight: 43, letterSpacing: -1.5, fontWeight: '800', marginTop: 10 }, description: { color: muted, fontSize: 16, lineHeight: 24, marginTop: 12 }, sectionLabel: { color: accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 27, marginBottom: 15 },
  cultureGrid: { gap: 10 }, cultureCard: { borderWidth: 1, borderColor: '#d8ded6', backgroundColor: '#fff', padding: 19, borderRadius: 5, flexDirection: 'row', justifyContent: 'space-between' }, cultureCardSelected: { borderColor: accent, backgroundColor: '#e8f1e9' }, cultureText: { color: ink, fontSize: 17, fontWeight: '600' }, cultureTextSelected: { color: accent, fontWeight: '800' }, cultureCheck: { color: accent, fontSize: 18 }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, chip: { borderRadius: 40, borderWidth: 1, borderColor: '#c9d5cb', paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#fff' }, chipSelected: { backgroundColor: accent, borderColor: accent }, chipText: { color: ink, fontSize: 14, fontWeight: '600' }, chipTextSelected: { color: '#fff' },
  edit: { color: accent, fontSize: 13, fontWeight: '700' }, homeHeading: { marginTop: 62, marginBottom: 28 }, cameraFrame: { height: 260, backgroundColor: '#dfe8dd', borderRadius: 7, marginBottom: 20, padding: 18, justifyContent: 'space-between' }, cameraInner: { borderWidth: 1, borderColor: '#83a094', borderStyle: 'dashed', flex: 1, alignItems: 'center', justifyContent: 'center' }, cameraIcon: { fontSize: 76, color: accent, lineHeight: 90 }, cameraText: { color: ink, fontSize: 14, fontWeight: '600' }, frameCorner: { color: accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 13 }, demoLink: { paddingVertical: 24, alignItems: 'center' }, demoText: { color: accent, fontSize: 14, fontWeight: '800' }, infoText: { color: muted, fontSize: 12, lineHeight: 18, marginTop: 15 },
  sampleBanner: { height: 94, backgroundColor: '#dce9d8', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 12 }, sampleBannerText: { color: accent, fontSize: 13, letterSpacing: 1.4, fontWeight: '800' }, menuRow: { paddingVertical: 21, borderBottomWidth: 1, borderBottomColor: '#dce3db', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, menuRowMain: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 }, menuNumber: { color: '#9aa9a0', fontSize: 11, fontWeight: '800', width: 38, marginTop: 5 }, menuRowCopy: { flex: 1 }, menuName: { color: ink, fontSize: 21, fontWeight: '700' }, menuSubtitle: { color: muted, fontSize: 13, marginTop: 5 }, rowArrow: { color: accent, fontSize: 22, marginLeft: 10 }, empty: { color: muted, paddingVertical: 25 },
  resultTitle: { color: ink, fontSize: 45, fontWeight: '800', letterSpacing: -1.5, marginTop: 4 }, resultSubtitle: { color: muted, fontSize: 17, marginTop: 4 }, scorePanel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e6efe5', padding: 22, borderRadius: 5, marginTop: 28 }, scoreLabel: { color: accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }, scoreNumber: { color: accent, fontSize: 61, fontWeight: '800', lineHeight: 70, letterSpacing: -2 }, scorePercent: { fontSize: 28 }, scoreBadge: { backgroundColor: '#c9e0cc', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 20 }, scoreBadgeLow: { backgroundColor: '#f7e4ca' }, scoreBadgeText: { color: accent, fontSize: 12, fontWeight: '800' }, scoreBadgeTextLow: { color: '#895229' }, tagLine: { color: muted, fontSize: 14, marginTop: 17 }, rule: { borderBottomWidth: 1, borderBottomColor: '#dce3db', marginTop: 25 }, comparison: { color: ink, fontSize: 23, lineHeight: 33, fontWeight: '600', letterSpacing: -0.3 }, contextLabel: { color: muted, fontSize: 10, letterSpacing: 1.3, fontWeight: '800', marginTop: 18 }, body: { color: ink, fontSize: 16, lineHeight: 25 }, sensory: { color: muted, fontSize: 14, lineHeight: 22, marginTop: 12 }, reason: { color: ink, fontSize: 16, lineHeight: 28, marginBottom: 5 }, check: { color: accent, fontWeight: '800' }, warning: { backgroundColor: '#fff0dd', padding: 15, borderRadius: 5, marginTop: 12 }, warningText: { color: '#7b4a20', fontSize: 14, lineHeight: 21 }, caution: { color: '#7b4a20', fontSize: 13, marginTop: 15 }, allergy: { color: muted, fontSize: 12, lineHeight: 19, marginTop: 23 }, error: { backgroundColor: '#fff0dd', padding: 12, borderRadius: 4, marginBottom: 20 }, errorText: { color: '#7b4a20', fontSize: 13 }, busyOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,48,40,0.76)', justifyContent: 'center', alignItems: 'center' }, busyText: { color: '#fff', fontSize: 15, marginTop: 15 },
});
