import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SupportedFood } from '../data/supportedFoods';
import { findAvailableModel, type AvailableModel } from '../features/modelAssets';
import { colors as c } from '../theme';

type ViewerElement = HTMLElement & { canActivateAR: boolean; activateAR: () => Promise<void> };
type ARStatusEvent = Event & { detail?: { status?: string } };
const fallback = "AR isn't available on this device. You can still explore the dish in 3D.";

function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function FoodModelPreview({ food }: { food: SupportedFood }) {
  const [resolved, setResolved] = useState<{ foodId: string; asset: AvailableModel | null } | null>(null);
  const [stage, setStage] = useState<'checking' | 'loading' | 'ready' | 'error'>('checking');
  const [arAvailable, setArAvailable] = useState(false);
  const [retry, setRetry] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerElement | null>(null);
  const asset = resolved?.foodId === food.id ? resolved.asset : null;

  useEffect(() => {
    let active = true;
    setResolved(null); setStage('checking'); setArAvailable(false);
    findAvailableModel(food).then(found => {
      if (!active) return;
      setResolved({ foodId: food.id, asset: found });
      if (found) setStage('loading');
    });
    return () => { active = false; };
  }, [food.id]);

  useEffect(() => {
    if (!asset) return;
    let active = true;
    let element: ViewerElement | null = null;
    const onLoad = () => { if (!active || !element) return; setStage('ready'); setArAvailable(element.canActivateAR && (!isIOSDevice() || !!asset.iosSrc)); };
    const onError = () => { if (active) setStage('error'); };
    const onARStatus = (event: Event) => { if ((event as ARStatusEvent).detail?.status === 'failed') setArAvailable(false); };
    import('@google/model-viewer').then(() => {
      if (!active || !hostRef.current) return;
      element = document.createElement('model-viewer') as ViewerElement;
      element.style.width = '100%'; element.style.height = '100%'; element.style.display = 'block';
      element.setAttribute('src', asset.src);
      element.setAttribute('alt', `Interactive 3D preview of ${food.name}`);
      element.setAttribute('camera-controls', '');
      element.setAttribute('shadow-intensity', '1');
      element.setAttribute('ar', '');
      element.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
      if (asset.iosSrc) element.setAttribute('ios-src', asset.iosSrc);
      element.addEventListener('load', onLoad);
      element.addEventListener('error', onError);
      element.addEventListener('ar-status', onARStatus);
      hostRef.current.appendChild(element);
      viewerRef.current = element;
    }).catch(() => { if (active) setStage('error'); });
    return () => {
      active = false;
      if (element) {
        element.removeEventListener('load', onLoad);
        element.removeEventListener('error', onError);
        element.removeEventListener('ar-status', onARStatus);
        element.remove();
      }
      viewerRef.current = null;
    };
  }, [asset?.src, asset?.iosSrc, food.name, retry]);

  if (!asset) return null;
  return <View style={s.card}><Text style={s.label}>EXPLORE IN 3D</Text><View style={s.stage}>
    <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
    {stage === 'loading' && <Text style={[s.status, s.overlay]}>Loading 3D preview…</Text>}
    {stage === 'error' && <View style={s.error}><Text style={s.status}>The 3D preview could not load.</Text><Pressable accessibilityRole="button" onPress={() => { setStage('loading'); setRetry(value => value + 1); }}><Text style={s.retry}>Try again</Text></Pressable></View>}
  </View><Text style={s.hint}>Drag to rotate · Pinch or scroll to zoom</Text>
    {stage === 'ready' && (arAvailable ? <Pressable accessibilityRole="button" onPress={() => viewerRef.current?.activateAR().catch(() => setArAvailable(false))} style={s.arButton}><Text style={s.arText}>View in AR</Text></Pressable> : <Text style={s.fallback}>{fallback}</Text>)}
  </View>;
}

const s = StyleSheet.create({ card: { backgroundColor: c.lavender, borderRadius: 24, padding: 16, marginBottom: 13 }, label: { color: c.blue, fontSize: 11, fontWeight: '600', marginBottom: 10 }, stage: { height: 280, borderRadius: 18, overflow: 'hidden', backgroundColor: c.white, justifyContent: 'center' }, status: { color: c.muted, fontSize: 12, textAlign: 'center' }, overlay: { position: 'absolute', alignSelf: 'center' }, error: { position: 'absolute', alignSelf: 'center', gap: 10 }, retry: { color: c.blue, fontSize: 12, fontWeight: '600', textAlign: 'center' }, hint: { color: c.muted, fontSize: 11, marginTop: 10 }, arButton: { height: 44, borderRadius: 14, backgroundColor: c.blue, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, arText: { color: c.white, fontSize: 13, fontWeight: '600' }, fallback: { color: c.muted, fontSize: 11, lineHeight: 15, marginTop: 10 } });
