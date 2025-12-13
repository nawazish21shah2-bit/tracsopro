/**
 * Unified Design System for Guard Tracking App
 * 
 * This is the single source of truth for all design tokens.
 * Use this file to maintain consistency across all screens and components.
 * 
 * Design Principles:
 * - Modern, professional, and clean
 * - Consistent spacing, typography, and colors
 * - Accessible and responsive
 * - Figma-inspired design system
 */

import { StyleSheet, Platform } from 'react-native';

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const Colors = {
  // Primary Brand Colors
  primary: '#1C6CA9',
  primaryLight: '#ACD3F1',
  primaryDark: '#0F4A73',
  primaryHover: '#1A5F94',
  
  // Secondary Colors
  secondary: '#E8F4FD',
  accent: '#FF6B6B',
  
  // Semantic Colors
  success: '#4CAF50',
  successLight: '#C8E6C9',
  successDark: '#388E3C',
  
  warning: '#FF9800',
  warningLight: '#FFE0B2',
  warningDark: '#F57C00',
  
  error: '#F44336',
  errorLight: '#FFCDD2',
  errorDark: '#D32F2F',
  
  info: '#2196F3',
  infoLight: '#BBDEFB',
  infoDark: '#1976D2',
  
  // Neutral Grays
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Text Colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    tertiary: '#9E9E9E',
    inverse: '#FFFFFF',
    link: '#1C6CA9',
    disabled: '#BDBDBD',
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F5F7FA',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Border Colors
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#757575',
    focus: '#1C6CA9',
  },
  
  // Status Colors (for badges, indicators)
  status: {
    active: '#4CAF50',
    inactive: '#9E9E9E',
    pending: '#FF9800',
    completed: '#2196F3',
    cancelled: '#F44336',
  },
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const Typography = {
  // Font Families
  fontFamily: {
    primary: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    secondary: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  
  // Font Sizes (scaled for mobile)
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
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
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
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
  
  // Text Styles (predefined combinations)
  textStyles: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 38.4,
      letterSpacing: -0.5,
      color: Colors.text.primary,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 28.8,
      letterSpacing: -0.5,
      color: Colors.text.primary,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: 0,
      color: Colors.text.primary,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 25.2,
      letterSpacing: 0,
      color: Colors.text.primary,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22.4,
      letterSpacing: 0,
      color: Colors.text.primary,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 19.6,
      letterSpacing: 0,
      color: Colors.text.secondary,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16.8,
      letterSpacing: 0,
      color: Colors.text.secondary,
    },
    label: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 19.6,
      letterSpacing: 0,
      color: Colors.text.primary,
    },
    button: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 22.4,
      letterSpacing: 0,
    },
  },
} as const;

// ============================================================================
// SPACING SYSTEM (8px base unit)
// ============================================================================

export const Spacing = {
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
} as const;

// ============================================================================
// BORDER RADIUS SYSTEM
// ============================================================================

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 9999,
} as const;

// ============================================================================
// SHADOW SYSTEM
// ============================================================================

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const Layout = {
  // Screen padding
  screenPadding: Spacing.lg,
  
  // Component heights
  inputHeight: 48,
  buttonHeight: 48,
  buttonHeightLarge: 56,
  headerHeight: 56,
  tabBarHeight: 64,
  
  // Component widths
  maxContentWidth: 600,
  cardMinWidth: 280,
  
  // Icon sizes
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
} as const;

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// ============================================================================
// COMMON STYLES
// ============================================================================

export const CommonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  containerSecondary: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  containerTertiary: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  paddedContainer: {
    flex: 1,
    padding: Layout.screenPadding,
    backgroundColor: Colors.background.primary,
  },
  
  // Card styles
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  cardElevated: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  
  // Text styles
  textH1: Typography.textStyles.h1,
  textH2: Typography.textStyles.h2,
  textH3: Typography.textStyles.h3,
  textH4: Typography.textStyles.h4,
  textBody: Typography.textStyles.body,
  textBodySmall: Typography.textStyles.bodySmall,
  textCaption: Typography.textStyles.caption,
  textLabel: Typography.textStyles.label,
  
  // Button base styles
  buttonBase: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    ...Typography.textStyles.button,
    color: Colors.text.inverse,
  },
  buttonTextSecondary: {
    ...Typography.textStyles.button,
    color: Colors.primary,
  },
  
  // Input base styles
  inputContainer: {
    height: Layout.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: Colors.border.focus,
    borderWidth: 2,
  },
  inputText: {
    flex: 1,
    ...Typography.textStyles.body,
    color: Colors.text.primary,
  },
  
  // Utility styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status color based on status string
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'active':
    case 'online':
    case 'success':
    case 'completed':
      return Colors.status.active;
    case 'inactive':
    case 'offline':
    case 'error':
    case 'cancelled':
      return Colors.status.cancelled;
    case 'warning':
    case 'pending':
      return Colors.status.pending;
    case 'info':
    case 'processing':
      return Colors.status.completed;
    default:
      return Colors.gray[500];
  }
};

/**
 * Get color with opacity (for overlays, etc.)
 */
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Get severity color
 */
export const getSeverityColor = (severity: string): string => {
  const severityLower = severity.toLowerCase();
  switch (severityLower) {
    case 'critical':
      return Colors.error;
    case 'high':
      return Colors.warning;
    case 'medium':
      return Colors.info;
    case 'low':
      return Colors.success;
    default:
      return Colors.gray[500];
  }
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  Animation,
  CommonStyles,
  getStatusColor,
  getColorWithOpacity,
  getSeverityColor,
};

