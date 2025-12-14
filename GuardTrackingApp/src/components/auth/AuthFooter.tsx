import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AuthFooterProps {
  text: string;
  linkText: string;
  onLinkPress: () => void;
  disabled?: boolean;
}

const AuthFooter: React.FC<AuthFooterProps> = ({ 
  text, 
  linkText, 
  onLinkPress, 
  disabled = false 
}) => {
  return (
    <View style={styles.footer}>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{text} </Text>
        <TouchableOpacity 
          onPress={onLinkPress} 
          disabled={disabled}
          activeOpacity={disabled ? 1 : 0.7}
        >
          <Text style={[styles.linkText, disabled && styles.disabledLink]}>{linkText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  footerText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#1C6CA9',
  },
  disabledLink: {
    opacity: 0.5,
  },
});

export default AuthFooter;
