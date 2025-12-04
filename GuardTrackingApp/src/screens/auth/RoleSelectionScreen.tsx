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
import { AppIcon } from '../../components/ui/AppIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../types';
import Logo from '../../assets/images/tracSOpro-logo.png';

type RoleSelectionScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'RoleSelection'>;

const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RoleSelectionScreenNavigationProp>();
  const [selectedRole, setSelectedRole] = useState<'guard' | 'client' | 'admin'>('guard');

  const handleContinue = () => {
    if (selectedRole === 'guard') {
      navigation.navigate('GuardSignup');
    } else if (selectedRole === 'client') {
      // Navigate to client account type selection
      navigation.navigate('ClientAccountType');
    } else if (selectedRole === 'admin') {
      // Navigate to admin account type selection (for companies)
      navigation.navigate('AdminAccountType');
    }
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
          <Text style={styles.title}>SELECT YOUR ROLE</Text>
          <Text style={styles.subtitle}>
            Please select your role to continue with the registration process.
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedRole === 'guard' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedRole('guard')}
          >
            <View style={styles.iconContainer}>
              <AppIcon type="material" name="security" size={40} color="#1C6CA9" />
            </View>
            <Text style={styles.optionTitle}>Security{"\n"}Guard</Text>
            <Text style={styles.optionDescription}>
              Register as a security guard to manage shifts and incidents
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedRole === 'client' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedRole('client')}
          >
            <View style={styles.iconContainer}>
              <AppIcon type="material" name="business" size={40} color="#1C6CA9" />
            </View>
            <Text style={styles.optionTitle}>Client{"\n"}Account</Text>
            <Text style={styles.optionDescription}>
              Register as a client to hire security services
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedRole === 'admin' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedRole('admin')}
          >
            <View style={styles.iconContainer}>
              <AppIcon type="material" name="admin-panel-settings" size={40} color="#1C6CA9" />
            </View>
            <Text style={styles.optionTitle}>Company{"\n"}Admin</Text>
            <Text style={styles.optionDescription}>
              Register as a company admin to manage your organization
            </Text>
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
    height: 140,
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
    marginBottom: 40,
    gap: 16,
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionCard: {
    height: 160,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '48%',
    minWidth: 140,
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
    fontSize: 16,
    lineHeight: 19,
    textAlign: 'center',
    color: '#000000',
    marginBottom: 8,
  },
  optionDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: '#6B7280',
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
    marginTop: 4,
  },
});

export default RoleSelectionScreen;
