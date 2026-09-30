import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Sparkle from '../assets/figma/sparkle-processing.svg';
import Check from '../assets/figma/check.svg';
import Dot from '../assets/figma/learn-dot.svg';
import { PrimaryButton, Screen, SecondaryButton } from '../src/components/UI';
import { detectSupportedFoods } from '../src/features/recognition';
import { ocrService, type OCRResult } from '../src/services/ocr/ocrService';
import { useProfile } from '../src/store/ProfileContext';
import { colors as c } from '../src/theme';

const steps = ['Reading menu text', 'Identifying supported dishes', 'Comparing with your taste profile'];
function withinTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('OCR timed out. Check your connection or try a clearer photo.')), milliseconds);
    promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
export default function Processing() {
  const router = useRouter();
  const { selectedImage, analysisStatus, setAnalysisStatus, analysisError, setAnalysisError, setOcrResult, setDetectedFoods } = useProfile();
  const [retry, setRetry] = useState(0);
  const activeJob = useRef<Promise<OCRResult> | null>(null);
  useEffect(() => {
    if (!selectedImage) { setAnalysisStatus('error'); setAnalysisError('Choose a menu image first.'); return; }
    let live = true;
    setAnalysisStatus('loading'); setAnalysisError(null);
    const job = activeJob.current ?? withinTimeout(ocrService.extractText(selectedImage.file, progress => { if (live) setAnalysisStatus(progress.stage === 'recognizing' ? 'reading' : 'loading'); }), 90000);
    activeJob.current = job;
    job.then(result => {
      if (!live) return;
      setOcrResult(result);
      setAnalysisStatus('matching');
      setDetectedFoods(detectSupportedFoods(result.rawText));
      setAnalysisStatus('complete');
      router.replace('/results');
    }).catch(error => {
      if (!live) return;
      setAnalysisStatus('error');
      setAnalysisError(error instanceof Error ? `Could not read the menu: ${error.message}` : 'Could not read the menu. Please try again.');
    });
    return () => { live = false; };
  }, [selectedImage?.file, retry]);
  const completed = analysisStatus === 'complete' ? 3 : analysisStatus === 'matching' ? 2 : analysisStatus === 'reading' ? 1 : 0;
  return <Screen contentStyle={s.root}><View style={s.top}><Text style={s.title}>Understanding your menu</Text><Text style={s.description}>We’re identifying dishes and turning them into familiar food experiences.</Text><View style={s.orb}><View style={s.mark}><Sparkle width={42} height={42} /></View></View><View style={s.steps}>{steps.map((step, index) => <View key={step} style={s.step}><View style={[s.stepMark, index >= completed && { backgroundColor: c.gray }]}>{index < completed ? <Check width={12} height={12} /> : <View style={s.pendingDot} />}</View><Text style={s.stepText}>{step}</Text></View>)}</View></View><View style={s.footer}>{analysisStatus === 'error' ? <><Text style={s.error}>{analysisError}</Text>{selectedImage && <PrimaryButton title="Try reading again" onPress={() => { activeJob.current = null; setRetry(value => value + 1); }} />}<SecondaryButton title="Choose another photo" onPress={() => router.replace('/scanner')} /></> : <View style={s.note}><Dot width={10} height={10} /><Text style={s.noteText}>Reading your image. The first scan may download language data.</Text></View>}</View></Screen>;
}
const s = StyleSheet.create({ root: { paddingTop: 18, paddingBottom: 18, justifyContent: 'space-between', alignItems: 'center' }, top: { alignItems: 'center', width: '100%' }, title: { color: c.ink, fontSize: 26, lineHeight: 30, fontWeight: '600', textAlign: 'center', marginBottom: 22 }, description: { color: c.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 300, marginBottom: 22 }, orb: { width: 200, height: 200, borderRadius: 100, backgroundColor: c.lavender, justifyContent: 'center', alignItems: 'center', marginBottom: 22 }, mark: { width: 112, height: 112, borderRadius: 56, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, justifyContent: 'center', alignItems: 'center' }, steps: { width: '100%', maxWidth: 312, gap: 12 }, step: { height: 26, flexDirection: 'row', alignItems: 'center', gap: 9 }, stepMark: { width: 20, height: 20, borderRadius: 10, backgroundColor: c.lime, alignItems: 'center', justifyContent: 'center' }, pendingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.muted }, stepText: { color: c.ink, fontSize: 12, fontWeight: '500' }, footer: { alignSelf: 'stretch', gap: 10 }, note: { minHeight: 58, borderRadius: 18, backgroundColor: c.paleLime, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginHorizontal: 8 }, noteText: { color: c.ink, fontSize: 12, fontWeight: '500', flex: 1 }, error: { color: '#B85037', fontSize: 13, textAlign: 'center', marginBottom: 10 } });
