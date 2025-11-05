// Global Style System for tracSOpro App
import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Design System Constants
export const COLORS = {
  // Primary Colors
  primary: '#1C6CA9',
  primaryLight: '#ACD3F1',
  primaryDark: '#0F4A73',
  
  // Secondary Colors
  secondary: '#E8F4FD',
  accent: '#FF6B6B',
  
  // Text Colors
  textPrimary: '#000000',
  textSecondary: '#828282',
  textTertiary: '#B0B0B0',
  textInverse: '#FFFFFF',
  textLink: '#1C6CA9',
  
  // Background Colors
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#E8F4FD',
  
  // Border Colors
  borderLight: '#ACD3F1',
  borderMedium: '#828282',
  borderDark: '#000000',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Card Colors
  cardBackground: '#FFFFFF',
  cardShadow: '#000000',
  
  // Dashboard Colors
  dashboardGreen: '#4CAF50',
  dashboardRed: '#F44336',
  dashboardBlue: '#2196F3',
  dashboardGray: '#9E9E9E',
};

export const TYPOGRAPHY = {
  // Font Families
  fontPrimary: 'Inter',
  fontSecondary: 'Montserrat',
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 32,
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.408,
    normal: 0,
    wide: 0.01,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
  xxxxxxl: 56,
  xxxxxxxl: 64,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 50,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const LAYOUT = {
  // Screen Dimensions
  screenWidth,
  screenHeight,
  
  // Container Widths
  containerWidth: 335,
  containerPadding: 20,
  
  // Component Heights
  inputHeight: 50,
  buttonHeight: 56,
  headerHeight: 60,
  tabBarHeight: 80,
  
  // Logo Dimensions
  logoSize: 140,
  logoCircleSize: 80,
  logoRingSize: 120,
};

// Global Component Styles
export const globalStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
    paddingTop: 40,
  },
  
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPrimary,
  },
  
  // Logo Styles
  logoContainer: {
    alignItems: 'center',
    position: 'absolute',
    width: LAYOUT.logoSize,
    height: LAYOUT.logoSize,
    left: '50%',
    marginLeft: -LAYOUT.logoSize / 2,
    top: 164,
  },
  
  logoWrapper: {
    width: LAYOUT.logoSize,
    height: LAYOUT.logoSize,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logoCircle: {
    width: LAYOUT.logoCircleSize,
    height: LAYOUT.logoCircleSize,
    borderRadius: LAYOUT.logoCircleSize / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  
  logoRing: {
    position: 'absolute',
    width: LAYOUT.logoRingSize,
    height: LAYOUT.logoRingSize,
    borderRadius: LAYOUT.logoRingSize / 2,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    top: 10,
    left: 10,
    zIndex: 1,
  },
  
  logoInitials: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  
  logoText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  
  // Typography Styles
  title: {
    position: 'absolute',
    width: 250,
    height: 29,
    left: '50%',
    marginLeft: -125,
    top: 226,
    fontFamily: TYPOGRAPHY.fontSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  
  subtitle: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  
  // Form Styles
  form: {
    position: 'absolute',
    width: LAYOUT.containerWidth,
    left: '50%',
    marginLeft: -LAYOUT.containerWidth / 2,
    bottom: 150,
  },
  
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: LAYOUT.containerWidth,
    height: LAYOUT.inputHeight,
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
  },
  
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  
  iconContainer: {
    width: 16,
    height: 16,
    marginRight: 10,
  },
  
  textInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 17,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    color: COLORS.textPrimary,
  },
  
  // Button Styles
  primaryButton: {
    width: LAYOUT.containerWidth,
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.small,
  },
  
  primaryButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
  },
  
  primaryButtonText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    color: COLORS.textInverse,
  },
  
  secondaryButton: {
    width: LAYOUT.containerWidth,
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  secondaryButtonText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
  },
  
  // Card Styles
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  
  cardTitle: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  
  cardContent: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
  },
  
  // Selection Card Styles (for Account Type)
  selectionCard: {
    flex: 1,
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginHorizontal: SPACING.sm,
    ...SHADOWS.small,
  },
  
  selectionCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.backgroundTertiary,
  },
  
  selectionCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  selectionCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  
  // Footer Styles
  footer: {
    position: 'absolute',
    width: 234,
    height: 17,
    left: '50%',
    marginLeft: -117,
    bottom: 78,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  footerText: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 17,
    textAlign: 'center',
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    color: COLORS.textSecondary,
  },
  
  footerLink: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 17,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    color: COLORS.textLink,
  },
  
  // Dashboard Styles
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  
  dashboardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Utility Styles
  flexRow: {
    flexDirection: 'row',
  },
  
  flexColumn: {
    flexDirection: 'column',
  },
  
  justifyCenter: {
    justifyContent: 'center',
  },
  
  alignCenter: {
    alignItems: 'center',
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  marginTop: {
    marginTop: SPACING.lg,
  },
  
  marginBottom: {
    marginBottom: SPACING.lg,
  },
  
  paddingHorizontal: {
    paddingHorizontal: SPACING.lg,
  },
  
  paddingVertical: {
    paddingVertical: SPACING.lg,
  },
});

// Helper Functions
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'online':
    case 'success':
      return COLORS.success;
    case 'inactive':
    case 'offline':
    case 'error':
      return COLORS.error;
    case 'warning':
    case 'pending':
      return COLORS.warning;
    case 'info':
    default:
      return COLORS.info;
  }
};

export const getColorWithOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export default globalStyles;
