// Shared Auth Screen Styles for Consistent Design
import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from './globalStyles';

// Standardized spacing and positioning for all auth screens
export const AUTH_LOGO_TOP = SPACING.xxxxl * 2; // 80px - Same top position for all logos
export const AUTH_LOGO_TO_HEADING = SPACING.xl; // 20px - Space between logo and heading
export const AUTH_HEADING_TO_FORM = SPACING.xxxxl + SPACING.lg; // 56px - Space between heading and form
export const AUTH_INPUT_GAP = SPACING.lg; // 16px - Space between input fields
export const AUTH_FOOTER_BOTTOM = 32; // 32px from bottom

export const authStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  
  // Logo - Same position across all screens
  logoContainer: {
    alignItems: 'center',
    marginTop: AUTH_LOGO_TOP,
    marginBottom: AUTH_LOGO_TO_HEADING,
  },
  logoImage: {
    width: 160,
    height: 140,
  },
  
  // Heading - Same position and styling across all screens
  title: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold, // Semibold, not bold
    fontSize: TYPOGRAPHY.fontSize.xxl,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: -0.408,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    marginBottom: AUTH_HEADING_TO_FORM,
  },
  
  // Subtitle (for role selection)
  subtitle: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 0, // No margin - directly below heading
    paddingHorizontal: SPACING.xl,
  },
  
  // Form container
  form: {
    paddingHorizontal: SPACING.lg,
    flex: 1,
  },
  
  // Input container
  inputContainer: {
    marginBottom: AUTH_INPUT_GAP,
  },
  
  // Options container (Remember Me, Forgot Password)
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xl, // 20px
  },
  
  // Checkbox
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xs,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  
  // Footer
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: AUTH_FOOTER_BOTTOM,
  },
  footerText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 17,
    textAlign: 'center',
    letterSpacing: -0.408,
    color: COLORS.textSecondary,
  },
  linkText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 17,
    letterSpacing: -0.408,
    color: COLORS.primary,
  },
});
