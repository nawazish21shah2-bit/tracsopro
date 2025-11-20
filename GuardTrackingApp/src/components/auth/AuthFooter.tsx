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
      <Text style={styles.footerText}>
        {text} 
        <TouchableOpacity onPress={onLinkPress} disabled={disabled}>
          <Text style={styles.linkText}> {linkText}</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    marginBottom: 20,
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
    marginTop: 4,
  },
});

export default AuthFooter;
