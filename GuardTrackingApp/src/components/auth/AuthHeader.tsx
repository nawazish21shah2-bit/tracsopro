import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Logo from '../../assets/images/tracSOpro-logo.png';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoImage: {
    width: 160,
    height: 140,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: 1,
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#6B7280',
    paddingHorizontal: 20,
  },
});

export default AuthHeader;
