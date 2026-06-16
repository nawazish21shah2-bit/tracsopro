import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompanyIcon } from '../../components/ui/AppIcons';
import Button from '../../components/common/Button';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthFooter from '../../components/auth/AuthFooter';
import { AuthStackParamList } from '../../types';
import { authStyles } from '../../styles/authStyles';
import { COLORS, SPACING } from '../../styles/globalStyles';

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

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader
          title="COMPANY ADMIN"
          subtitle="Register as a company administrator to manage your organization's security operations."
        />

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

        <View style={authStyles.authActions}>
          <Button
            title="Continue"
            onPress={handleContinue}
            fullWidth
            size="large"
            disabled={!selectedType}
            style={authStyles.submitButton}
          />
        </View>

        <AuthFooter
          text="Already have an account?"
          linkText="Login"
          onLinkPress={navigateToLogin}
        />
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
    paddingBottom: SPACING.lg,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxxxl,
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
});

export default AdminAccountTypeScreen;

