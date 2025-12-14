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
import { authStyles, AUTH_HEADING_TO_FORM } from '../../styles/authStyles';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

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
        <View style={authStyles.logoContainer}>
          <Image source={Logo} style={authStyles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[authStyles.title, styles.titleWithSubtitle]}>SELECT YOUR ROLE</Text>
          <Text style={authStyles.subtitle}>
            Please select your role to continue with the registration process.
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.optionsContainer}>
          {/* First Row - 2 Cards */}
          <View style={styles.firstRow}>
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
          </View>

          {/* Second Row - 1 Card Centered */}
          <View style={styles.secondRow}>
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
        <View style={authStyles.footer}>
          <View style={styles.footerRow}>
            <Text style={authStyles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleAlreadyHaveAccount} activeOpacity={0.7}>
              <Text style={authStyles.linkText}>Login</Text>
            </TouchableOpacity>
          </View>
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
  // Logo, title styles moved to authStyles.ts
  titleContainer: {
    alignItems: 'center',
    marginBottom: AUTH_HEADING_TO_FORM, // Same spacing as other screens
  },
  // Override title marginBottom for role selection to reduce space before subtitle
  titleWithSubtitle: {
    marginBottom: SPACING.sm, // Reduced space between title and subtitle (8px)
  },
  optionsContainer: {
    marginBottom: 40,
    flex: 1,
    justifyContent: 'center',
  },
  firstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg, // Reduced gap between rows (16px instead of 56px)
    gap: SPACING.lg,
  },
  secondRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCard: {
    height: 160,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    width: '48%',
    minWidth: 140,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '20', // 20% opacity
  },
  iconContainer: {
    marginBottom: 12,
  },
  optionTitle: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 19,
    textAlign: 'center',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  optionDescription: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    lineHeight: 16,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  continueButton: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  // Footer styles moved to authStyles.ts
});

export default RoleSelectionScreen;
