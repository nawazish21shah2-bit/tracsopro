import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ViewStyle, ImageStyle, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuIcon, BellIcon } from './FeatherIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';
import Logo from '../../assets/images/tracSOpro-logo.png';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showLogo = false,
  onMenuPress,
  onNotificationPress,
  leftIcon,
  rightIcon,
  style,
}) => {
  const insets = useSafeAreaInsets();
  // const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    if (onMenuPress) {
      return (
        <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
          <MenuIcon size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.iconButton} />;
  };

  const renderCenter = () => {
    if (showLogo) {
      return (
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoImage as ImageStyle} resizeMode="contain" />
        </View>
      );
    }
    if (title) {
      return <Text style={styles.title}>{title}</Text>;
    }
    return null;
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    if (onNotificationPress) {
      return (
        <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
          <BellIcon size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.iconButton} />;
  };

  return (
    <View style={[styles.container, style]}>
      {renderLeft()}
      {renderCenter()}
      {renderRight()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    minHeight: 60,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 30,
  },
});

export default AppHeader;
