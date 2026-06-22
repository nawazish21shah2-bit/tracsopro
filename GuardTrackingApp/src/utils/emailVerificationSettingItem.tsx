import React from 'react';
import { Mail } from 'react-native-feather';

export interface SettingsMenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

/** Returns a settings row for unverified users; empty array when email is already verified. */
export function getEmailVerificationSettingItems(
  isEmailVerified: boolean,
  onPress: () => void,
  iconColor = '#828282',
): SettingsMenuItem[] {
  if (isEmailVerified) {
    return [];
  }

  return [
    {
      id: 'email-verification',
      title: 'Verify Email',
      icon: <Mail width={20} height={20} color={iconColor} />,
      onPress,
    },
  ];
}
