import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupportedFood, type SupportedFood } from '../data/supportedFoods';
import { calculateTasteMatch, type TasteProfile } from '../features/tasteMatch';
import { initialProfile, migrateProfile } from '../features/profileMigration';
import { clampSensitivity, cultureFromLanguage, defaultSensitivities, isFoodCulture, toggleAllergen as nextAllergens, type Allergen, type FoodCulture, type SensitivityKey } from '../data/personalization';
import type { OCRResult } from '../services/ocr/ocrService';

export type SelectedImage = { file: File; uri: string; name: string };
export type SavedScan = { place: string; date: string; dishId: string };
export type AnalysisStatus = 'idle' | 'loading' | 'reading' | 'matching' | 'complete' | 'error';
type Persisted = { profile: TasteProfile; onboardingCompleted: boolean; savedScans: SavedScan[] };
type AppState = {
  ready: boolean; profile: TasteProfile; culture: FoodCulture; setCulture: (value: FoodCulture) => void;
  setSensitivity: (key: SensitivityKey, value: number) => void; toggleAllergen: (value: Allergen | 'none') => void; resetPersonalization: () => void;
  toggleLike: (value: string) => void; toggleAvoid: (value: string) => void;
  onboardingCompleted: boolean; completeOnboarding: () => void;
  selectedImage: SelectedImage | null; selectImage: (file: File) => void; clearImage: () => void;
  ocrResult: OCRResult | null; setOcrResult: (result: OCRResult | null) => void;
  detectedFoods: SupportedFood[]; setDetectedFoods: (foods: SupportedFood[]) => void;
  analysisStatus: AnalysisStatus; setAnalysisStatus: (status: AnalysisStatus) => void;
  analysisError: string | null; setAnalysisError: (message: string | null) => void;
  selectedDishId: string | null; setSelectedDishId: (id: string | null) => void;
  savedScans: SavedScan[]; savedDishIds: string[]; saveDishToTry: (id: string) => void;
  matchFor: (food: SupportedFood) => ReturnType<typeof calculateTasteMatch>;
};
const Context = createContext<AppState | null>(null);
const storageKey = 'ai-food-lens-profile-v1';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<TasteProfile>(() => ({ ...initialProfile, culture: typeof navigator === 'undefined' ? 'Korean' : cultureFromLanguage(navigator.language) ?? 'Korean', sensitivities: { ...defaultSensitivities }, allergens: [] }));
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [detectedFoods, setDetectedFoods] = useState<SupportedFood[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(value => {
      if (value) {
        const saved = JSON.parse(value) as Partial<Persisted>;
        if (saved.profile) setProfile(migrateProfile(saved.profile));
        if (saved.onboardingCompleted) setOnboardingCompleted(true);
        if (Array.isArray(saved.savedScans)) setSavedScans(saved.savedScans.filter(scan => !!getSupportedFood(scan.dishId)));
      }
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(storageKey, JSON.stringify({ profile, onboardingCompleted, savedScans })).catch(() => {}); }, [ready, profile, onboardingCompleted, savedScans]);
  const setCulture = (culture: FoodCulture) => { if (isFoodCulture(culture)) setProfile(current => ({ ...current, culture })); };
  const setSensitivity = (key: SensitivityKey, value: number) => setProfile(current => ({ ...current, sensitivities: { ...current.sensitivities, [key]: clampSensitivity(value, current.sensitivities[key]) } }));
  const toggleAllergen = (value: Allergen | 'none') => setProfile(current => ({ ...current, allergens: nextAllergens(current.allergens, value) }));
  const resetPersonalization = () => setProfile(current => ({ ...current, sensitivities: { ...defaultSensitivities }, allergens: [] }));
  const toggleLike = (value: string) => setProfile(current => ({ ...current, likes: current.likes.includes(value) ? current.likes.filter(item => item !== value) : [...current.likes, value] }));
  const toggleAvoid = (value: string) => setProfile(current => ({ ...current, avoids: current.avoids.includes(value) ? current.avoids.filter(item => item !== value) : [...current.avoids, value] }));
  const selectImage = (file: File) => {
    setSelectedImage(current => { if (current) URL.revokeObjectURL(current.uri); return { file, uri: URL.createObjectURL(file), name: file.name }; });
    setOcrResult(null); setDetectedFoods([]); setAnalysisStatus('idle'); setAnalysisError(null);
  };
  const clearImage = () => { setSelectedImage(current => { if (current) URL.revokeObjectURL(current.uri); return null; }); setAnalysisStatus('idle'); };
  const saveDishToTry = (id: string) => {
    if (!getSupportedFood(id)) return;
    setSelectedDishId(id);
    setSavedScans(current => current.some(scan => scan.dishId === id) ? current : [{ place: 'Menu scan', date: new Date().toLocaleDateString(), dishId: id }, ...current]);
  };
  const savedDishIds = useMemo(() => savedScans.map(scan => scan.dishId), [savedScans]);
  return <Context.Provider value={{
    ready, profile, culture: profile.culture, setCulture, setSensitivity, toggleAllergen, resetPersonalization, toggleLike, toggleAvoid,
    onboardingCompleted, completeOnboarding: () => setOnboardingCompleted(true), selectedImage, selectImage, clearImage,
    ocrResult, setOcrResult, detectedFoods, setDetectedFoods, analysisStatus, setAnalysisStatus, analysisError, setAnalysisError,
    selectedDishId, setSelectedDishId, savedScans, savedDishIds, saveDishToTry, matchFor: food => calculateTasteMatch(food, profile),
  }}>{ready ? children : null}</Context.Provider>;
}
export function useProfile(): AppState {
  const context = useContext(Context);
  if (!context) throw new Error('ProfileProvider missing');
  return context;
}
