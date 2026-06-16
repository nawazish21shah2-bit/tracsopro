import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { authStyles } from '../../styles/authStyles';

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
  disabled = false,
}) => {
  return (
    <View style={authStyles.footerLinkRow}>
      <Text style={authStyles.footerText}>{text} </Text>
      <TouchableOpacity
        onPress={onLinkPress}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[authStyles.linkText, disabled && { opacity: 0.5 }]}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthFooter;
