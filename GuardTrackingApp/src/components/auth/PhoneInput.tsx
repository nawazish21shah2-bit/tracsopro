import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  countryCode?: string;
  flag?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Phone Number',
  value,
  onChangeText,
  error,
  placeholder = '312 3456 7890',
  countryCode = '+1',
  flag = '🇺🇸',
}) => {
  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as XXX XXX XXXX
    if (cleaned.length >= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.phoneLabel}>{label}</Text>
      <View style={[styles.phoneInputWrapper, error && styles.inputError]}>
        <View style={styles.countryCodeContainer}>
          <Text style={styles.flagText}>{flag}</Text>
          <Text style={styles.countryCode}>{countryCode}</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder={placeholder}
          value={value}
          onChangeText={handlePhoneChange}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={12} // XXX XXX XXXX format
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  flagText: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#000000',
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
