// Account Type Selection Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { PersonIcon, AppIcon } from '../../components/ui/AppIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../utils/theme';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../types';
import Logo from '../../assets/images/tracSOpro-logo.png';

type AccountTypeScreenNavigationProp = StackNavigationProp<any, any>;

const AccountTypeScreen: React.FC = () => {
  const navigation = useNavigation<AccountTypeScreenNavigationProp>();
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<'individual' | 'company'>('individual');

  const handleContinue = () => {
    // Navigate to appropriate registration screen based on selection
    navigation.navigate('ClientSignup', { accountType: selectedType });
  };

  const handleAlreadyHaveAccount = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SELECT ACCOUNT</Text>
          <Text style={styles.subtitle}>
            Please select the account type that is relevant to your need.
          </Text>
        </View>

        {/* Account Type Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'individual' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedType('individual')}
          >
            <View style={styles.iconContainer}>
              <PersonIcon size={40} color="#1C6CA9" />
            </View>
            <Text style={styles.optionTitle}>Individual{"\n"}Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'company' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedType('company')}
          >
            <View style={styles.iconContainer}>
              <AppIcon type="material" name="groups" size={40} color="#1C6CA9" />
            </View>
            <Text style={styles.optionTitle}>Company{"\n"}Account</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          fullWidth
          size="large"
          style={styles.continueButton}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account? 
            <TouchableOpacity onPress={handleAlreadyHaveAccount}>
              <Text style={styles.loginLink}> Login</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  logoImage: {
    width: 160,
    height: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: 1,
    color: '#000000',
    marginBottom: 16,
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 16,
  },
  optionCard: {
    flex: 1,
    height: 140,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  optionCardSelected: {
    borderColor: '#1C6CA9',
    backgroundColor: '#EBF5FF',
  },
  iconContainer: {
    marginBottom: 12,
  },
  optionTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 17,
    textAlign: 'center',
    color: '#000000',
  },
  continueButton: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    color: '#6B7280',
  },
  loginLink: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 17,
    color: '#1C6CA9',
  },
});

export default AccountTypeScreen;
