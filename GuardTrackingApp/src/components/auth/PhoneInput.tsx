import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Country, defaultCountry } from '../../utils/countries';
import CountryPicker from './CountryPicker';
import { authInputStyles } from '../../styles/authStyles';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onCountryChange?: (country: Country) => void;
  error?: string;
  placeholder?: string;
  selectedCountry?: Country;
  icon?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChangeText,
  onCountryChange,
  error,
  placeholder,
  selectedCountry: initialCountry,
  icon,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry || defaultCountry);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const formatPhoneNumber = (text: string, country: Country) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format based on country (default US format: XXX XXX XXXX)
    if (country.code === 'US' || country.code === 'CA') {
      if (cleaned.length >= 6) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
      } else if (cleaned.length >= 3) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      }
      return cleaned;
    }
    
    // For other countries, just return cleaned digits (no formatting)
    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text, selectedCountry);
    onChangeText(formatted);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    if (onCountryChange) {
      onCountryChange(country);
    }
  };

  const getMaxLength = () => {
    // US/Canada: XXX XXX XXXX format (12 chars with spaces)
    if (selectedCountry.code === 'US' || selectedCountry.code === 'CA') {
      return 12;
    }
    // For other countries, allow up to 15 digits (E.164 max)
    return 15;
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (selectedCountry.code === 'US' || selectedCountry.code === 'CA') {
      return '312 3456 7890';
    }
    return 'Enter phone number';
  };

  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.phoneLabel}>{label}</Text>}
      <View style={[
        authInputStyles.inputWrapper,
        focused && authInputStyles.inputFocused,
        error && authInputStyles.inputError,
      ]}>
        <TouchableOpacity
          style={styles.countryCodeContainer}
          onPress={() => setShowCountryPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.flagText}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCode}>{selectedCountry.dialCode}</Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
        <TextInput
          style={authInputStyles.textInput}
          placeholder={getPlaceholder()}
          value={value}
          onChangeText={handlePhoneChange}
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="phone-pad"
          maxLength={getMaxLength()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error && <Text style={authInputStyles.errorText}>{error}</Text>}
      
      <CountryPicker
        selectedCountry={selectedCountry}
        onSelectCountry={handleCountrySelect}
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  phoneLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
    minWidth: 100,
    marginRight: 8,
  },
  flagText: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  countryCode: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  dropdownIcon: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
});

export default PhoneInput;
