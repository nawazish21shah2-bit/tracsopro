import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../styles/globalStyles';

export function useSafeTopPadding(extra = SPACING.lg): number {
  const insets = useSafeAreaInsets();
  const statusBarInset =
    Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return Math.max(insets.top, statusBarInset) + extra;
}
