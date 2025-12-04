import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Country, defaultCountry } from '../../utils/countries';
import CountryPicker from './CountryPicker';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onCountryChange?: (country: Country) => void;
  error?: string;
  placeholder?: string;
  selectedCountry?: Country;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Phone Number',
  value,
  onChangeText,
  onCountryChange,
  error,
  placeholder,
  selectedCountry: initialCountry,
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

  return (
    <View style={styles.container}>
      {label && <Text style={styles.phoneLabel}>{label}</Text>}
      <View style={[styles.phoneInputWrapper, error && styles.inputError]}>
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
          style={styles.phoneInput}
          placeholder={getPlaceholder()}
          value={value}
          onChangeText={handlePhoneChange}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={getMaxLength()}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
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
  container: {
    marginBottom: 20,
  },
  phoneLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 56,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 100,
  },
  flagText: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCode: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#000000',
    marginRight: 4,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 2,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default PhoneInput;
