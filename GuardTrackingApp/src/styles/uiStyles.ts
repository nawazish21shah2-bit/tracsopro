import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from './globalStyles';

// Streamlined UI styles for consistent active/inactive states throughout the app
export const uiStyles = StyleSheet.create({
  // Button States
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  buttonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  
  // Text States
  textPrimary: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
  },
  textSecondary: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textDisabled: {
    color: '#CCCCCC',
  },
  
  // Card States
  cardBase: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  cardActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cardInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardDisabled: {
    backgroundColor: '#F8F9FA',
    borderColor: '#F0F0F0',
  },
  
  // Icon Container States
  iconContainerBase: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: COLORS.primary,
  },
  iconContainerInactive: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconContainerDisabled: {
    backgroundColor: '#F8F9FA',
    borderColor: '#F0F0F0',
  },
  
  // Status Indicator States
  statusDotBase: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotInactive: {
    backgroundColor: '#CCCCCC',
  },
  statusDotWarning: {
    backgroundColor: '#F59E0B',
  },
  statusDotError: {
    backgroundColor: '#EF4444',
  },
  
  // Input States
  inputBase: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: TYPOGRAPHY.fontSize.md,
    backgroundColor: '#FFFFFF',
  },
  inputDefault: {
    borderColor: '#E0E0E0',
    color: COLORS.textPrimary,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: '#F8F9FA',
    borderColor: '#F0F0F0',
    color: '#CCCCCC',
  },
  
  // List Item States
  listItemBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  listItemActive: {
    backgroundColor: `${COLORS.primary}10`, // 10% opacity
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  listItemPressed: {
    backgroundColor: '#F8F9FA',
  },
  
  // Badge States
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: '#10B981',
  },
  badgeInactive: {
    backgroundColor: '#CCCCCC',
  },
  badgeWarning: {
    backgroundColor: '#F59E0B',
  },
  badgeError: {
    backgroundColor: '#EF4444',
  },
  badgeInfo: {
    backgroundColor: COLORS.primary,
  },
  
  // Tab States
  tabBase: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabInactive: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  
  // Switch/Toggle States
  switchBase: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  switchInactive: {
    backgroundColor: '#CCCCCC',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  
  // Progress States
  progressBase: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  
  // Divider States
  dividerBase: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: SPACING.sm,
  },
  dividerThick: {
    height: 2,
    backgroundColor: '#CCCCCC',
  },
  
  // Shadow States
  shadowLight: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  shadowHeavy: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});

// Helper functions for dynamic styling
export const getButtonStyle = (variant: 'primary' | 'secondary' | 'disabled' = 'primary') => {
  const baseStyle = [uiStyles.buttonBase];
  
  switch (variant) {
    case 'primary':
      return [...baseStyle, uiStyles.buttonPrimary];
    case 'secondary':
      return [...baseStyle, uiStyles.buttonSecondary];
    case 'disabled':
      return [...baseStyle, uiStyles.buttonDisabled];
    default:
      return [...baseStyle, uiStyles.buttonPrimary];
  }
};

export const getTextStyle = (variant: 'primary' | 'secondary' | 'active' | 'disabled' = 'primary') => {
  switch (variant) {
    case 'primary':
      return uiStyles.textPrimary;
    case 'secondary':
      return uiStyles.textSecondary;
    case 'active':
      return uiStyles.textActive;
    case 'disabled':
      return uiStyles.textDisabled;
    default:
      return uiStyles.textPrimary;
  }
};

export const getCardStyle = (variant: 'active' | 'inactive' | 'disabled' = 'inactive') => {
  const baseStyle = [uiStyles.cardBase];
  
  switch (variant) {
    case 'active':
      return [...baseStyle, uiStyles.cardActive];
    case 'inactive':
      return [...baseStyle, uiStyles.cardInactive];
    case 'disabled':
      return [...baseStyle, uiStyles.cardDisabled];
    default:
      return [...baseStyle, uiStyles.cardInactive];
  }
};

export const getIconContainerStyle = (variant: 'active' | 'inactive' | 'disabled' = 'inactive') => {
  const baseStyle = [uiStyles.iconContainerBase];
  
  switch (variant) {
    case 'active':
      return [...baseStyle, uiStyles.iconContainerActive];
    case 'inactive':
      return [...baseStyle, uiStyles.iconContainerInactive];
    case 'disabled':
      return [...baseStyle, uiStyles.iconContainerDisabled];
    default:
      return [...baseStyle, uiStyles.iconContainerInactive];
  }
};

export const getStatusDotStyle = (variant: 'active' | 'inactive' | 'warning' | 'error' = 'inactive') => {
  const baseStyle = [uiStyles.statusDotBase];
  
  switch (variant) {
    case 'active':
      return [...baseStyle, uiStyles.statusDotActive];
    case 'inactive':
      return [...baseStyle, uiStyles.statusDotInactive];
    case 'warning':
      return [...baseStyle, uiStyles.statusDotWarning];
    case 'error':
      return [...baseStyle, uiStyles.statusDotError];
    default:
      return [...baseStyle, uiStyles.statusDotInactive];
  }
};

export const getBadgeStyle = (variant: 'active' | 'inactive' | 'warning' | 'error' | 'info' = 'inactive') => {
  const baseStyle = [uiStyles.badgeBase];
  
  switch (variant) {
    case 'active':
      return [...baseStyle, uiStyles.badgeActive];
    case 'inactive':
      return [...baseStyle, uiStyles.badgeInactive];
    case 'warning':
      return [...baseStyle, uiStyles.badgeWarning];
    case 'error':
      return [...baseStyle, uiStyles.badgeError];
    case 'info':
      return [...baseStyle, uiStyles.badgeInfo];
    default:
      return [...baseStyle, uiStyles.badgeInactive];
  }
};

// Color constants for consistent usage
export const UI_COLORS = {
  primary: COLORS.primary,
  active: COLORS.primary,
  inactive: '#CCCCCC',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  text: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
  textActive: '#FFFFFF',
  textDisabled: '#CCCCCC',
};
