import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { IndividualIcon, CompanyIcon } from '../../components/ui/AppIcons';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../types';
import Logo from '../../assets/images/tracSOpro-logo.png';

type ClientAccountTypeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ClientAccountType'>;

const ClientAccountTypeScreen: React.FC = () => {
  const navigation = useNavigation<ClientAccountTypeScreenNavigationProp>();
  const [selectedType, setSelectedType] = useState<'individual' | 'company' | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      navigation.navigate('ClientSignup', { accountType: selectedType });
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>SELECT ACCOUNT</Text>
        <Text style={styles.subtitle}>
          Please select the account type that is{'\n'}relevant to your need.
        </Text>
      </View>

      {/* Account Type Options */}
      <View style={styles.optionsContainer}>
        {/* Individual Account */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedType === 'individual' && styles.optionCardSelected
          ]}
          onPress={() => setSelectedType('individual')}
        >
          <View style={styles.iconContainer}>
            <IndividualIcon 
              size={32} 
              color={selectedType === 'individual' ? '#1C6CA9' : '#6B7280'} 
            />
          </View>
          <Text style={[
            styles.optionTitle,
            selectedType === 'individual' && styles.optionTitleSelected
          ]}>
            Individual{'\n'}Account
          </Text>
        </TouchableOpacity>

        {/* Company Account */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedType === 'company' && styles.optionCardSelected
          ]}
          onPress={() => setSelectedType('company')}
        >
          <View style={styles.iconContainer}>
            <CompanyIcon 
              size={32} 
              color={selectedType === 'company' ? '#1C6CA9' : '#6B7280'} 
            />
          </View>
          <Text style={[
            styles.optionTitle,
            selectedType === 'company' && styles.optionTitleSelected
          ]}>
            Company{'\n'}Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          fullWidth
          size="large"
          disabled={!selectedType}
          style={styles.continueButton}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account? 
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginText}> Login</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoImage: {
    width: 160,
    height: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
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
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 80,
    gap: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 140,
  },
  optionCardSelected: {
    borderColor: '#1C6CA9',
    backgroundColor: '#EBF4FF',
  },
  iconContainer: {
    marginBottom: 16,
  },
  optionTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    color: '#374151',
  },
  optionTitleSelected: {
    color: '#1C6CA9',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  continueButton: {
    marginBottom: 0,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
  },
  loginText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#1C6CA9',
  },
});

export default ClientAccountTypeScreen;
