import { createElement, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useProfile } from '../store/ProfileContext';
import { prepareMenuImage } from '../features/prepareMenuImage';

export function useMenuImageInput(onSelected: () => void) {
  const camera = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { selectImage } = useProfile();
  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return; // User cancelled the system picker.
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('Choose an image smaller than 15 MB.'); return; }
    setLoading(true); setError(null);
    const preview = URL.createObjectURL(file);
    try {
      const decoded = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('The image could not be opened. Try another photo.'));
        image.src = preview;
      });
      selectImage(await prepareMenuImage(file, decoded));
      onSelected();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The image could not be opened.');
    } finally {
      URL.revokeObjectURL(preview);
      setLoading(false);
    }
  };
  const inputs = Platform.OS === 'web' ? <>
    {createElement('input', { ref: camera, type: 'file', accept: 'image/*', capture: 'environment', onChange: handleFile, style: { display: 'none' }, 'aria-label': 'Take a menu photo' })}
    {createElement('input', { ref: upload, type: 'file', accept: 'image/*', onChange: handleFile, style: { display: 'none' }, 'aria-label': 'Upload a menu photo' })}
  </> : null;
  const open = (target: React.RefObject<HTMLInputElement | null>) => {
    if (Platform.OS !== 'web') { setError('Open the web app to scan a menu.'); return; }
    if (!target.current) { setError('Image input is unavailable. Try another browser.'); return; }
    target.current.click();
  };
  return { inputs, openCamera: () => open(camera), openUpload: () => open(upload), error, loading };
}
