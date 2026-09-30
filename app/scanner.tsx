import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Close from '../assets/figma/close.svg';
import CaptureControls from '../assets/figma/capture-controls.svg';
import { PrimaryButton, Screen } from '../src/components/UI';
import { useMenuImageInput } from '../src/components/MenuImageInput';
import { useProfile } from '../src/store/ProfileContext';
import { colors as c } from '../src/theme';

export default function Scanner() {
  const router = useRouter();
  const { selectedImage } = useProfile();
  const picker = useMenuImageInput(() => {});
  return <Screen contentStyle={s.root}>{picker.inputs}<View style={s.header}><Pressable accessibilityLabel="Close scanner" onPress={() => router.push('/home')} style={s.close}><Close width={18} height={18} /></Pressable><Text style={s.headerTitle}>Menu scanner</Text><View style={{ width: 40 }} /></View><View style={s.viewport}>
    {selectedImage ? <Image source={{ uri: selectedImage.uri }} resizeMode="contain" style={s.preview} accessibilityLabel="Selected menu image" /> : <View style={s.placeholder}><Text style={s.placeholderTitle}>Your menu photo appears here</Text><Text style={s.placeholderBody}>Take a photo or choose an image to read the menu.</Text></View>}
    {selectedImage && <View pointerEvents="none" style={s.focus}><View style={s.reading}><Text style={s.readingText}>Image ready</Text></View></View>}
  </View><Text style={s.hint}>{picker.loading ? 'Opening your image…' : 'Prototype supports 5 selected dishes.'}</Text>{picker.error && <Text style={s.error}>{picker.error}</Text>}
    <View style={s.actions}><Pressable accessibilityRole="button" accessibilityLabel={selectedImage ? 'Retake menu photo' : 'Take a menu photo'} onPress={picker.openCamera} style={s.capture}><CaptureControls width="100%" height={58} /><Text style={s.captureText}>{selectedImage ? 'Retake photo' : 'Take photo'}</Text></Pressable><Pressable accessibilityRole="button" onPress={picker.openUpload} style={s.upload}><Text style={s.uploadText}>{selectedImage ? 'Replace from gallery' : 'Upload photo instead'}</Text></Pressable>{selectedImage && <PrimaryButton title="Analyze image" onPress={() => router.push('/processing')} />}</View>
  </Screen>;
}
const s = StyleSheet.create({ root: { paddingTop: 6, paddingBottom: 20 }, header: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }, close: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.gray, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: c.ink, fontSize: 16, fontWeight: '600' }, viewport: { flex: 1, minHeight: 220, borderRadius: 28, backgroundColor: c.gray, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, preview: { width: '100%', height: '100%' }, placeholder: { width: '80%', minHeight: 250, borderRadius: 18, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, padding: 24, alignItems: 'center', justifyContent: 'center' }, placeholderTitle: { color: c.ink, fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 12 }, placeholderBody: { color: c.muted, fontSize: 13, textAlign: 'center' }, focus: { position: 'absolute', width: '85%', height: 112, borderWidth: 2, borderColor: c.blue, borderStyle: 'dashed', borderRadius: 18, top: '41%' }, reading: { height: 30, minWidth: 104, borderRadius: 15, backgroundColor: c.blue, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: -16 }, readingText: { color: c.white, fontSize: 11, fontWeight: '600' }, hint: { alignSelf: 'center', color: c.muted, fontSize: 12, marginTop: 16, marginBottom: 10 }, error: { color: '#B85037', fontSize: 12, textAlign: 'center', marginBottom: 8 }, actions: { gap: 8 }, capture: { height: 78, alignItems: 'center', justifyContent: 'center' }, captureText: { color: c.muted, fontSize: 11, fontWeight: '500' }, upload: { height: 40, alignItems: 'center', justifyContent: 'center' }, uploadText: { color: c.blue, fontSize: 13, fontWeight: '600' } });
