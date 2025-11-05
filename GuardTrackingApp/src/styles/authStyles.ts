import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  form: {
    marginBottom: 40,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
    color: '#000000',
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    marginBottom: 20,
  },
  // Selection Cards
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 80,
    gap: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 140,
  },
  optionCardSelected: {
    borderColor: '#1C6CA9',
    backgroundColor: '#EBF4FF',
  },
  optionTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    color: '#374151',
  },
  optionTitleSelected: {
    color: '#1C6CA9',
  },
  iconContainer: {
    marginBottom: 16,
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
