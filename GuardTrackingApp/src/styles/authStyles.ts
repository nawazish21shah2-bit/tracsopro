// Shared Auth Screen Styles for Consistent Design
import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from './globalStyles';

// Standardized spacing and positioning for all auth screens
export const AUTH_LOGO_TOP = SPACING.xxxxl * 2; // 80px - Same top position for all logos
export const AUTH_LOGO_TO_HEADING = SPACING.xl; // 20px - Space between logo and heading
export const AUTH_HEADING_TO_FORM = SPACING.xxxxl; // 40px - Space between heading block and form (apply once)
export const AUTH_INPUT_GAP = SPACING.lg; // 16px - Space between input fields
export const AUTH_SUBMIT_MARGIN_TOP = SPACING.xxxxl; // 40px - Space after last field before submit
export const AUTH_SUBMIT_TO_FOOTER = SPACING.xxxl; // 32px - Space between submit and footer link
export const AUTH_FOOTER_BOTTOM = 32; // 32px from bottom

/** Shared bordered input styles used by Login and all auth forms */
export const authInputStyles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 56,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  textInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  errorText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  label: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
});

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
  
  // Heading block — single margin below title/subtitle group (avoids double gap with form)
  headingBlock: {
    alignItems: 'center',
    marginBottom: AUTH_HEADING_TO_FORM,
  },

  // Heading - no bottom margin; spacing handled by headingBlock / auth header container
  title: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold, // Semibold, not bold
    fontSize: TYPOGRAPHY.fontSize.xxl,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: -0.408,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 0,
  },
  
  // Subtitle (for role selection)
  subtitle: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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

  submitButton: {
    marginTop: AUTH_SUBMIT_MARGIN_TOP,
  },

  /** Wraps full-width auth buttons so they align with form padding without overflowing */
  authActions: {
    paddingHorizontal: SPACING.lg,
  },

  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: AUTH_SUBMIT_TO_FOOTER,
    paddingBottom: SPACING.lg,
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
  
  // Footer wrapper (legacy); prefer footerLinkRow for submit-to-login spacing
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
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
