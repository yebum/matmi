import { Stack } from 'expo-router';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProfileProvider } from '../src/store/ProfileContext';

export default function RootLayout() {
  return <SafeAreaProvider><ProfileProvider><StatusBar hidden={Platform.OS === 'web'} barStyle="dark-content" /><Stack screenOptions={{ headerShown: false, animation: 'fade' }} /></ProfileProvider></SafeAreaProvider>;
}
