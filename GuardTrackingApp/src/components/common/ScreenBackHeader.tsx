import React from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackNavButton from './BackNavButton';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

interface ScreenBackHeaderProps {
  title: string;
  onBack: () => void;
  backgroundColor?: string;
}

const HEADER_ACTION_WIDTH = 44;

const ScreenBackHeader: React.FC<ScreenBackHeaderProps> = ({
  title,
  onBack,
  backgroundColor = COLORS.backgroundPrimary,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} translucent={false} />
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + SPACING.sm,
            backgroundColor,
          },
        ]}
      >
        <View style={styles.side}>
          <BackNavButton onPress={onBack} iconOnly />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.side} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  side: {
    width: HEADER_ACTION_WIDTH,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default ScreenBackHeader;
