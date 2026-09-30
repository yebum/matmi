import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { SupportedFood } from '../data/supportedFoods';
import { findAvailableModel } from '../features/modelAssets';
import { colors as c } from '../theme';

export function LiveFoodModel({ food, width, height }: { food: SupportedFood; width: number; height: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let active = true;
    let element: HTMLElement | null = null;
    setStage('loading');
    findAvailableModel(food).then(async asset => {
      if (!active) return;
      if (!asset) { setStage('error'); return; }
      await import('@google/model-viewer');
      if (!active || !host.current) return;
      element = document.createElement('model-viewer');
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.pointerEvents = 'none';
      element.setAttribute('src', asset.src);
      element.setAttribute('alt', `3D preview of ${food.name}`);
      element.setAttribute('auto-rotate', '');
      element.setAttribute('rotation-per-second', '18deg');
      element.setAttribute('shadow-intensity', '0.5');
      element.addEventListener('load', onLoad);
      element.addEventListener('error', onError);
      host.current.appendChild(element);
    }).catch(onError);
    function onLoad() { if (active) setStage('ready'); }
    function onError() { if (active) setStage('error'); }
    return () => {
      active = false;
      if (element) { element.removeEventListener('load', onLoad); element.removeEventListener('error', onError); element.remove(); }
    };
  }, [food.id]);
  return <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
    <div ref={host} style={{ width: '100%', height: '100%' }} />
    {stage !== 'ready' && <Text style={{ position: 'absolute', color: c.ink, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
      {stage === 'loading' ? `${food.name} detected · loading 3D` : `${food.name} detected · 3D unavailable`}
    </Text>}
  </View>;
}
