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
import { CompanyIcon } from '../../components/ui/AppIcons';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../types';
import Logo from '../../assets/images/tracSOpro-logo.png';

type AdminAccountTypeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'AdminAccountType'>;

const AdminAccountTypeScreen: React.FC = () => {
  const navigation = useNavigation<AdminAccountTypeScreenNavigationProp>();
  const [selectedType, setSelectedType] = useState<'company' | null>('company');

  const handleContinue = () => {
    if (selectedType) {
      navigation.navigate('AdminSignup', { accountType: selectedType });
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
        <Text style={styles.title}>COMPANY ADMIN</Text>
        <Text style={styles.subtitle}>
          Register as a company administrator to manage{'\n'}your organization's security operations.
        </Text>
      </View>

      {/* Account Type Options */}
      <View style={styles.optionsContainer}>
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
              size={48} 
              color={selectedType === 'company' ? '#1C6CA9' : '#6B7280'} 
            />
          </View>
          <Text style={[
            styles.optionTitle,
            selectedType === 'company' && styles.optionTitleSelected
          ]}>
            Company{'\n'}Account
          </Text>
          <Text style={styles.optionDescription}>
            Manage your company's security operations,{'\n'}guards, and shifts
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
    justifyContent: 'center',
    marginBottom: 80,
  },
  optionCard: {
    flex: 1,
    maxWidth: 300,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 200,
  },
  optionCardSelected: {
    borderColor: '#1C6CA9',
    backgroundColor: '#EBF4FF',
  },
  iconContainer: {
    marginBottom: 20,
  },
  optionTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    color: '#374151',
    marginBottom: 12,
  },
  optionTitleSelected: {
    color: '#1C6CA9',
  },
  optionDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#6B7280',
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

export default AdminAccountTypeScreen;

