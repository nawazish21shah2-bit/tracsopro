import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from './globalStyles';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxxxl,
  },
  form: {
    marginBottom: SPACING.xxxxl,
  },
  sectionContainer: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    marginBottom: SPACING.lg,
  },
  // Selection Cards
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxxxl * 2,
    gap: SPACING.lg,
  },
  optionCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    minHeight: 140,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionTitle: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 20,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  optionTitleSelected: {
    color: COLORS.primary,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
});

export const colors = {
  primary: '#1C6CA9',
  primaryLight: '#EBF4FF',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  red: {
    500: '#EF4444',
  },
  green: {
    500: '#10B981',
  },
};

export const typography = {
  fontFamily: {
    primary: 'Inter',
    heading: 'Montserrat',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
