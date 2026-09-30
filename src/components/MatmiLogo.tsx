import { useState } from 'react';
import { Image, Platform, StyleSheet, Text } from 'react-native';
import { colors as c } from '../theme';

// Switch this path to /brand/matmi-logo.png when the final PNG is supplied.
const logoPath = '/brand/matmi-logo.webp';

export function MatmiLogo({ size = 252 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  if (Platform.OS !== 'web' || failed) return <Text accessibilityLabel="MATMI" style={s.fallback}>MATMI</Text>;
  return <Image source={{ uri: logoPath }} accessibilityLabel="MATMI" resizeMode="contain" onError={() => setFailed(true)} style={{ width: size, height: size }} />;
}

const s = StyleSheet.create({ fallback: { color: c.ink, fontSize: 30, fontWeight: '700' } });
