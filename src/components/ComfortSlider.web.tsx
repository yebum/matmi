import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors as c } from '../theme';

export function ComfortSlider({ label, explanation, low, high, value, onChange }: { label: string; explanation: string; low: string; high: string; value: number; onChange: (value: number) => void }) {
  const input = createElement('input', {
    type: 'range', min: 0, max: 10, step: 1, value,
    'aria-label': `${label} comfort level`,
    'aria-valuetext': `${value} out of 10`,
    onInput: (event: any) => onChange(Number(event.currentTarget.value)),
    onChange: (event: any) => onChange(Number(event.currentTarget.value)),
    style: { position: 'absolute', inset: 0, width: '100%', height: 48, margin: 0, opacity: 0, cursor: 'pointer', touchAction: 'none' },
  });
  return <View style={s.card}><View style={s.top}><View style={s.copy}><Text style={s.label}>{label}</Text><Text style={s.explanation}>{explanation}</Text></View><Text style={s.value}>{value} / 10</Text></View><View style={s.slider}><View style={s.track}><View style={[s.fill, { width: `${value * 10}%` }]} /><View style={[s.thumb, { left: `${value * 10}%` }]} /></View>{input}</View><View style={s.ends}><Text style={s.end}>{low}</Text><Text style={s.end}>{high}</Text></View></View>;
}
const s = StyleSheet.create({ card: { borderRadius: 22, borderWidth: 1, borderColor: c.line, backgroundColor: c.white, padding: 16, marginBottom: 10 }, top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, copy: { flex: 1 }, label: { color: c.ink, fontSize: 16, fontWeight: '600' }, explanation: { color: c.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, value: { color: c.blue, fontSize: 14, fontWeight: '700' }, slider: { height: 48, justifyContent: 'center', marginHorizontal: 8 }, track: { height: 6, borderRadius: 3, backgroundColor: c.line }, fill: { height: 6, borderRadius: 3, backgroundColor: c.blue }, thumb: { position: 'absolute', top: -9, width: 24, height: 24, borderRadius: 12, backgroundColor: c.blue, borderWidth: 3, borderColor: c.white, transform: [{ translateX: -12 }] }, ends: { flexDirection: 'row', justifyContent: 'space-between' }, end: { color: c.muted, fontSize: 11 } });
