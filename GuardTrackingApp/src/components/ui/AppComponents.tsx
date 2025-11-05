// Reusable UI Components for tracSOpro App
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StatusBar,
  Image,
} from 'react-native';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import Logo from '../../assets/images/tracSOpro-logo.png';

// Logo Component
interface AppLogoProps {
  style?: ViewStyle;
}

export const AppLogo: React.FC<AppLogoProps> = ({ style }) => {
  return (
    <View style={[globalStyles.logoContainer, style]}>
      <Image source={Logo} style={{ width: 140, height: 36 }} resizeMode="contain" />
    </View>
  );
};

// Screen Title Component
interface AppTitleProps {
  children: string;
  style?: TextStyle;
}

export const AppTitle: React.FC<AppTitleProps> = ({ children, style }) => {
  return <Text style={[globalStyles.title, style]}>{children}</Text>;
};

// Subtitle Component
interface AppSubtitleProps {
  children: string;
  style?: TextStyle;
}

export const AppSubtitle: React.FC<AppSubtitleProps> = ({ children, style }) => {
  return <Text style={[globalStyles.subtitle, style]}>{children}</Text>;
};

// Primary Button Component
interface AppButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}) => {
  const buttonStyle = variant === 'primary' ? globalStyles.primaryButton : globalStyles.secondaryButton;
  const textStyle = variant === 'primary' ? globalStyles.primaryButtonText : globalStyles.secondaryButtonText;
  
  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        disabled && globalStyles.primaryButtonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text style={textStyle}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

// Input Field Component
interface AppInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  inputRef?: React.RefObject<TextInput>;
  returnKeyType?: 'done' | 'next' | 'search' | 'send' | 'go';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  style,
  inputRef,
  returnKeyType = 'done',
  onSubmitEditing,
  blurOnSubmit = true,
}) => {
  return (
    <View style={[globalStyles.inputContainer, style]}>
      <View style={globalStyles.inputWrapper}>
        {leftIcon && (
          <View style={globalStyles.iconContainer}>
            <Text style={styles.iconText}>{leftIcon}</Text>
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={globalStyles.textInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={!disabled}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
        />
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Text style={styles.iconText}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Selection Card Component (for Account Type)
interface AppSelectionCardProps {
  title: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const AppSelectionCard: React.FC<AppSelectionCardProps> = ({
  title,
  icon,
  selected,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        globalStyles.selectionCard,
        selected && globalStyles.selectionCardSelected,
        style,
      ]}
      onPress={onPress}
    >
      <View style={globalStyles.selectionCardIcon}>
        <Text style={styles.selectionIconText}>{icon}</Text>
      </View>
      <Text style={globalStyles.selectionCardTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

// Footer Component
interface AppFooterProps {
  text: string;
  linkText: string;
  onLinkPress: () => void;
  style?: ViewStyle;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  text,
  linkText,
  onLinkPress,
  style,
}) => {
  return (
    <View style={[globalStyles.footer, style]}>
      <Text style={globalStyles.footerText}>
        {text}
        <TouchableOpacity onPress={onLinkPress}>
          <Text style={globalStyles.footerLink}> {linkText}</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
};

// Screen Container Component
interface AppScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AppScreen: React.FC<AppScreenProps> = ({ children, style }) => {
  return (
    <View style={[globalStyles.container, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />
      {children}
    </View>
  );
};

// Form Container Component
interface AppFormProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AppForm: React.FC<AppFormProps> = ({ children, style }) => {
  return <View style={[globalStyles.form, style]}>{children}</View>;
};

// Card Component for Dashboard
interface AppCardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AppCard: React.FC<AppCardProps> = ({ title, children, style }) => {
  return (
    <View style={[globalStyles.card, style]}>
      {title && <Text style={globalStyles.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
};

// Enhanced Stat Card Component for Dashboard
interface AppStatCardProps {
  number: string | number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const AppStatCard: React.FC<AppStatCardProps> = ({
  number,
  label,
  icon,
  color = COLORS.primary,
  backgroundColor,
  style,
}) => {
  return (
    <View style={[globalStyles.statCard, { backgroundColor }, style]}>
      {icon && <View style={styles.statIcon}>{icon}</View>}
      <View style={styles.statContent}>
        <Text style={[globalStyles.statNumber, { color }]}>{number}</Text>
        <Text style={globalStyles.statLabel}>{label}</Text>
      </View>
    </View>
  );
};

// Stat Grid Component
interface AppStatGridProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AppStatGrid: React.FC<AppStatGridProps> = ({ children, style }) => {
  return <View style={[styles.statGrid, style]}>{children}</View>;
};

// Upload Button Component
interface AppUploadButtonProps {
  title: string;
  icon: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const AppUploadButton: React.FC<AppUploadButtonProps> = ({
  title,
  icon,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.uploadButton, style]}
      onPress={onPress}
    >
      <Text style={styles.uploadIcon}>{icon}</Text>
      <Text style={styles.uploadText}>{title}</Text>
    </TouchableOpacity>
  );
};

// Dropdown Component
interface AppDropdownProps {
  placeholder: string;
  value: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const AppDropdown: React.FC<AppDropdownProps> = ({
  placeholder,
  value,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.dropdown, style]}
      onPress={onPress}
    >
      <Text style={[
        styles.dropdownText,
        { color: value ? COLORS.textPrimary : COLORS.textSecondary }
      ]}>
        {value || placeholder}
      </Text>
      <Text style={styles.dropdownArrow}>▼</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  rightIconContainer: {
    padding: SPACING.sm,
  },
  selectionIconText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    marginBottom: SPACING.md,
    minHeight: 56,
  },
  uploadIcon: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    marginRight: SPACING.md,
    color: COLORS.textTertiary,
  },
  uploadText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginLeft: SPACING.sm,
  },
  statIcon: {
    marginBottom: SPACING.xs,
    alignItems: 'center',
  },
  statContent: {
    alignItems: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
});

export default {
  AppLogo,
  AppTitle,
  AppSubtitle,
  AppButton,
  AppInput,
  AppSelectionCard,
  AppFooter,
  AppScreen,
  AppForm,
  AppCard,
  AppStatCard,
  AppUploadButton,
  AppDropdown,
};
