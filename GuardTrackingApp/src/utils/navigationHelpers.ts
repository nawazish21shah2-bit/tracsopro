import { NavigationProp, ParamListBase } from '@react-navigation/native';

export function navigateToEmailVerification(navigation: NavigationProp<ParamListBase>): void {
  let current: NavigationProp<ParamListBase> | undefined = navigation;

  while (current) {
    const routeNames = current.getState?.()?.routeNames;
    if (routeNames?.includes('EmailVerification')) {
      current.navigate('EmailVerification');
      return;
    }
    current = current.getParent?.();
  }

  navigation.navigate('EmailVerification' as never);
}
