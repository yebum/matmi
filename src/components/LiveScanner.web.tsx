import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Close from '../../assets/figma/close.svg';
import { getSupportedFood } from '../data/supportedFoods';
import { canvasBoxToVideo, detectLiveFoods, frameMapping, LiveDetectionTracker, scanGuide, videoBoxToViewport,
  type Box, type LiveFoodDetection } from '../features/liveScanner';
import { scannerOverlayLayout, smoothOverlayBox } from '../features/scannerOverlayLayout';
import { LiveMenuOCR } from '../services/ocr/liveOcr';
import { useProfile } from '../store/ProfileContext';
import { colors as c } from '../theme';
import { useMenuImageInput } from './MenuImageInput';
import { LiveFoodModel } from './LiveFoodModel';
import { PrimaryButton, Screen } from './UI';

type CameraState = 'starting' | 'ready' | 'denied' | 'unavailable';
type DebugState = { elapsedMs: number; rawText: string; confidence: number; detected: string; bbox: string };
const debugEnabled = typeof __DEV__ !== 'undefined' && __DEV__ && typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('ocrDebug');

function clamp(value: number, low: number, high: number) { return Math.max(low, Math.min(value, high)); }

export default function LiveScanner() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { selectedImage, clearImage, matchFor } = useProfile();
  const [photoMode, setPhotoMode] = useState(mode === 'photo' && !!selectedImage);
  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [cameraMessage, setCameraMessage] = useState('Opening the camera…');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [workerState, setWorkerState] = useState('Waiting for camera');
  const [detections, setDetections] = useState<LiveFoodDetection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cameraRetry, setCameraRetry] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [debug, setDebug] = useState<DebugState | null>(null);
  const viewportRef = useRef(viewport);
  const videoRef = useRef<HTMLVideoElement>(null);
  const picker = useMenuImageInput(() => setPhotoMode(true));

  useEffect(() => { if (mode === 'photo' && selectedImage) setPhotoMode(true); }, [mode, selectedImage?.uri]);
  useEffect(() => {
    setActiveId(current => current && detections.some(item => item.foodId === current) ? current : detections[0]?.foodId ?? null);
  }, [detections]);

  useFocusEffect(useCallback(() => {
    if (photoMode) return;
    let live = true;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let permissionTimer: ReturnType<typeof setTimeout> | null = null;
    let ticker: ReturnType<typeof setInterval> | null = null;
    const tracker = new LiveDetectionTracker();
    const canvas = document.createElement('canvas');
    const ocr = new LiveMenuOCR(state => { if (live && debugEnabled) setWorkerState(state); });
    setCameraState('starting'); setCameraMessage('Opening the camera…'); setOcrError(null); setDetections([]);

    async function sample() {
      if (!live) return;
      const video = videoRef.current;
      const size = viewportRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth || !size.width || !size.height) {
        timer = setTimeout(sample, 300); return;
      }
      try {
        const mapping = frameMapping(video.videoWidth, video.videoHeight, size.width, size.height);
        canvas.width = mapping.canvasWidth; canvas.height = mapping.canvasHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable.');
        context.drawImage(video, mapping.roi.x, mapping.roi.y, mapping.roi.width, mapping.roi.height,
          0, 0, mapping.canvasWidth, mapping.canvasHeight);
        const result = await ocr.recognize(canvas);
        if (!live) return;
        const candidates = detectLiveFoods(result.lines).map(item => ({ ...item, bbox: canvasBoxToVideo(item.bbox, mapping) }));
        const confirmed = tracker.update(candidates, performance.now());
        setDetections(previous => confirmed.map(item => {
          const prior = previous.find(existing => existing.foodId === item.foodId);
          return prior ? { ...item, bbox: smoothOverlayBox(prior.bbox, item.bbox) } : item;
        }));
        setOcrError(null);
        if (debugEnabled) setDebug({ elapsedMs: result.elapsedMs, rawText: result.rawText,
          confidence: result.confidence, detected: candidates.map(item => item.foodId).join(', ') || 'none',
          bbox: candidates.map(item => `${item.foodId}: ${JSON.stringify(item.bbox)}`).join(' · ') || 'none' });
        timer = setTimeout(sample, Math.max(120, 1000 - result.elapsedMs));
      } catch (error) {
        if (!live) return;
        setOcrError(error instanceof Error ? error.message : 'Recognition paused.');
        timer = setTimeout(sample, 1200);
      }
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('unavailable'); setCameraMessage('Live camera is unavailable in this browser. Upload a menu photo instead.'); return;
      }
      permissionTimer = setTimeout(() => { if (live) setCameraMessage('Waiting for camera access. You can upload a menu photo instead.'); }, 8000);
      try {
        const acquired = await navigator.mediaDevices.getUserMedia({ audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
        if (permissionTimer) clearTimeout(permissionTimer);
        if (!live) { acquired.getTracks().forEach(track => track.stop()); return; }
        stream = acquired;
        const video = videoRef.current;
        if (!video) throw new Error('The camera view is unavailable.');
        video.srcObject = acquired;
        await video.play();
        if (!live) return;
        setCameraState('ready');
        await ocr.initialize();
        if (!live) return;
        ticker = setInterval(() => {
          const visible = new Set(tracker.current(performance.now()).map(item => item.foodId));
          setDetections(previous => previous.filter(item => visible.has(item.foodId)));
        }, 500);
        void sample();
      } catch (error) {
        if (permissionTimer) clearTimeout(permissionTimer);
        if (!live) return;
        const denied = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
        setCameraState(denied ? 'denied' : 'unavailable');
        setCameraMessage(denied ? 'Camera access was denied. Upload a menu photo or try again after allowing camera access.' :
          (typeof isSecureContext !== 'undefined' && !isSecureContext ? 'Open MATMI over HTTPS to use the live camera.' : 'The camera could not start. Upload a menu photo instead.'));
        stream?.getTracks().forEach(track => track.stop());
      }
    }
    void start();
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
      if (permissionTimer) clearTimeout(permissionTimer);
      if (ticker) clearInterval(ticker);
      stream?.getTracks().forEach(track => track.stop());
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
      void ocr.close();
    };
  }, [photoMode, cameraRetry]));

  const onViewportLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    viewportRef.current = { width, height };
    setViewport({ width, height });
  };
  const mapping = viewport.width && viewport.height && videoRef.current?.videoWidth && videoRef.current?.videoHeight
    ? frameMapping(videoRef.current.videoWidth, videoRef.current.videoHeight, viewport.width, viewport.height) : null;
  const displayed = mapping ? detections.map(item => ({ ...item, screenBox: videoBoxToViewport(item.bbox, mapping) })) : [];
  const active = displayed.find(item => item.foodId === activeId);
  const activeFood = active && getSupportedFood(active.foodId);
  const guide = viewport.width && viewport.height ? scanGuide(viewport.width, viewport.height) : null;
  const openDetail = (id: string) => router.push({ pathname: '/food/[id]', params: { id } });
  const markerPosition = (box: Box) => ({ left: clamp(box.x, 6, Math.max(6, viewport.width - 130)),
    top: clamp(box.y + box.height + 5, 6, Math.max(6, viewport.height - 40)) });
  const activeLayout = active && scannerOverlayLayout(active.screenBox, viewport.width, viewport.height);

  return <Screen contentStyle={s.root}>{picker.inputs}
    <View style={s.header}><Pressable accessibilityLabel="Close scanner" onPress={() => router.push('/home')} style={s.close}><Close width={18} height={18} /></Pressable>
      <Text style={s.headerTitle}>Menu Lens</Text><View style={{ width: 40 }} /></View>
    <View style={s.viewport} onLayout={onViewportLayout}>
      {photoMode && selectedImage ? <Image source={{ uri: selectedImage.uri }} resizeMode="contain" style={s.preview} accessibilityLabel="Selected menu image" /> : <>
        <video ref={videoRef} autoPlay muted playsInline aria-label="Live menu camera" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'none', display: 'block' }} />
        {cameraState === 'ready' && guide && <View pointerEvents="none" style={[s.guide, { left: guide.x, top: guide.y, width: guide.width, height: guide.height }]} />}
        {cameraState !== 'ready' && <View style={s.cameraMessage}><Text style={s.cameraMessageText}>{cameraMessage}</Text></View>}
        {cameraState === 'ready' && displayed.filter(item => item.foodId !== activeId).map(item => {
          const food = getSupportedFood(item.foodId);
          if (!food) return null;
          return <Pressable key={item.foodId} accessibilityRole="button"
            accessibilityLabel={`${food.name}, ${matchFor(food).score}% match, select 3D preview`}
            onPress={() => setActiveId(food.id)} style={[s.marker, markerPosition(item.screenBox)]}>
            <Text style={s.markerText}>{food.name} · {matchFor(food).score}% Match</Text>
          </Pressable>;
        })}
        {activeFood && activeLayout && <Pressable accessibilityRole="button" accessibilityLabel={`Open ${activeFood.name} Food Lens`}
          onPress={() => openDetail(activeFood.id)} style={[s.activeOverlay, { left: activeLayout.left, top: activeLayout.top, width: activeLayout.modelWidth }]}>
          {activeLayout.placement === 'below' && <View style={s.activeLabel}><Text style={s.markerText}>{activeFood.name} · {matchFor(activeFood).score}% Match</Text></View>}
          <LiveFoodModel key={activeFood.id} food={activeFood} width={activeLayout.modelWidth} height={activeLayout.modelHeight} />
          {activeLayout.placement === 'above' && <View style={s.activeLabel}><Text style={s.markerText}>{activeFood.name} · {matchFor(activeFood).score}% Match</Text></View>}
        </Pressable>}
      </>}
    </View>
    <Text style={s.prompt}>{photoMode ? 'Image ready' : 'Point your camera at a menu'}</Text>
    <Text style={s.hint}>Prototype supports 5 selected dishes.</Text>
    {picker.error && <Text style={s.error}>{picker.error}</Text>}
    {ocrError && !photoMode && <Text style={s.error}>OCR: {ocrError}</Text>}
    <View style={s.actions}>
      {photoMode && selectedImage && <PrimaryButton title="Analyze image" onPress={() => router.push('/processing')} />}
      <Pressable accessibilityRole="button" onPress={picker.openUpload} style={s.upload}><Text style={s.uploadText}>{photoMode ? 'Replace image' : 'Upload menu photo'}</Text></Pressable>
      {photoMode && <Pressable accessibilityRole="button" onPress={() => { clearImage(); setPhotoMode(false); }} style={s.subtle}><Text style={s.subtleText}>Return to live camera</Text></Pressable>}
      {!photoMode && cameraState !== 'ready' && cameraState !== 'starting' && <Pressable accessibilityRole="button" onPress={() => setCameraRetry(value => value + 1)} style={s.subtle}><Text style={s.subtleText}>Try live camera again</Text></Pressable>}
      {!photoMode && <Pressable accessibilityRole="button" onPress={picker.openCamera} style={s.subtle}><Text style={s.subtleText}>Take a photo instead</Text></Pressable>}
      {!photoMode && ocrError && cameraState === 'ready' && <Pressable accessibilityRole="button" onPress={() => setCameraRetry(value => value + 1)} style={s.subtle}><Text style={s.subtleText}>Restart recognition</Text></Pressable>}
    </View>
    {debugEnabled && <View style={s.debug}><Text style={s.debugText}>Worker: {workerState} · OCR: {Math.round(debug?.elapsedMs ?? 0)}ms · Confidence: {Math.round(debug?.confidence ?? 0)}</Text>
      <Text style={s.debugText}>Detected: {debug?.detected ?? 'none'} · Bbox: {debug?.bbox ?? 'none'}</Text>
      <Text style={s.debugText} numberOfLines={3}>{debug?.rawText ?? ''}</Text></View>}
  </Screen>;
}

const s = StyleSheet.create({
  root: { paddingTop: 6, paddingBottom: 12 }, header: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.gray, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: c.ink, fontSize: 16, fontWeight: '600' },
  viewport: { flex: 1, minHeight: 400, borderRadius: 28, backgroundColor: c.ink, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: '100%' }, guide: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)', borderRadius: 18 },
  cameraMessage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', padding: 24 },
  cameraMessageText: { color: c.white, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  marker: { position: 'absolute', minWidth: 120, maxWidth: 190, minHeight: 30, borderRadius: 12, backgroundColor: 'rgba(25,25,30,0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 5 },
  markerText: { color: c.white, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  activeOverlay: { position: 'absolute', alignItems: 'center' },
  activeLabel: { width: '100%', minHeight: 26, borderRadius: 12, backgroundColor: c.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 3 },
  prompt: { color: c.ink, fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 14 },
  hint: { color: c.muted, fontSize: 11, textAlign: 'center', marginTop: 5, marginBottom: 10 },
  error: { color: '#B85037', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  actions: { gap: 7 }, upload: { minHeight: 44, borderRadius: 15, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
  uploadText: { color: c.blue, fontSize: 13, fontWeight: '600' }, subtle: { minHeight: 28, alignItems: 'center', justifyContent: 'center' },
  subtleText: { color: c.muted, fontSize: 12, fontWeight: '500' },
  debug: { maxHeight: 98, padding: 8, borderRadius: 10, backgroundColor: c.gray, marginTop: 8 }, debugText: { color: c.ink, fontSize: 9 },
});
