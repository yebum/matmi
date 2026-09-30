import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from './UI';

export default function LiveScanner() {
  const router = useRouter();
  return <Screen><Text onPress={() => router.back()}>The live menu scanner is available in the MATMI web app.</Text></Screen>;
}
