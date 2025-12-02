/**
 * Payment Methods Screen - Manage payment methods
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { CreditCardIcon, PlusIcon, TrashIcon, CheckCircleIcon } from '../../components/ui/AppIcons';
import paymentService, { PaymentMethod } from '../../services/paymentService';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error: any) {
      console.error('Error loading payment methods:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load payment methods'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setLoading(true);
      
      // Create setup intent
      const setupIntent = await paymentService.createSetupIntent();
      
      // Initialize Stripe if not already done
      try {
        const stripeService = (await import('../../services/stripeService')).default;
        if (!stripeService.isInitialized()) {
          await stripeService.initialize();
        }
      } catch (error) {
        console.error('Stripe initialization error:', error);
        Alert.alert(
          'Error',
          'Failed to initialize payment system. Please try again.',
        );
        return;
      }

      // Use Stripe PaymentSheet for setup intent
      try {
        // Initialize payment sheet with setup intent
        const { error: initError } = await initPaymentSheet({
          setupIntentClientSecret: setupIntent.clientSecret,
          merchantDisplayName: 'tracSOpro',
        });

        if (initError) {
          throw new Error(initError.message);
        }

        // Present payment sheet
        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          if (presentError.code !== 'Canceled') {
            throw new Error(presentError.message);
          }
          // User canceled - no error needed
          return;
        }

        // Payment method added successfully
        Alert.alert(
          'Success',
          'Payment method added successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reload payment methods
                loadPaymentMethods();
              },
            },
          ]
        );
      } catch (error: any) {
        console.error('Payment method setup error:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to add payment method. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Error creating setup intent:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to initialize payment method setup'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      setProcessing(methodId);
      await paymentService.setupAutomaticPayments(methodId);
      
      Alert.alert('Success', 'Default payment method updated');
      loadPaymentMethods();
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to set default payment method'
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleRemovePaymentMethod = (method: PaymentMethod) => {
    if (method.isDefault) {
      Alert.alert(
        'Cannot Remove',
        'You cannot remove your default payment method. Please set another payment method as default first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${method.brand?.toUpperCase()} •••• ${method.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement remove payment method API
            Alert.alert(
              'Feature Coming Soon',
              'Payment method removal will be available soon.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const formatCardBrand = (brand?: string): string => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Methods</Text>
        <TouchableOpacity onPress={handleAddPaymentMethod}>
          <PlusIcon size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CreditCardIcon size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No payment methods</Text>
            <Text style={styles.emptySubtext}>
              Add a payment method to make payments easier
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddPaymentMethod}
            >
              <Text style={styles.addFirstButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.methodsContainer}>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.methodCard}>
                <View style={styles.methodInfo}>
                  <CreditCardIcon size={24} color={COLORS.primary} />
                  <View style={styles.methodDetails}>
                    <Text style={styles.methodText}>
                      {formatCardBrand(method.brand)} •••• {method.last4}
                    </Text>
                    {method.expiryMonth && method.expiryYear && (
                      <Text style={styles.methodExpiry}>
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.methodActions}>
                  {method.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <CheckCircleIcon size={16} color={COLORS.success} />
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.setDefaultButton,
                        processing === method.id && styles.setDefaultButtonDisabled,
                      ]}
                      onPress={() => handleSetDefault(method.id)}
                      disabled={processing === method.id}
                    >
                      {processing === method.id ? (
                        <ActivityIndicator color={COLORS.primary} size="small" />
                      ) : (
                        <Text style={styles.setDefaultButtonText}>Set Default</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemovePaymentMethod(method)}
                  >
                    <TrashIcon size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 400,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  addFirstButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  methodsContainer: {
    padding: SPACING.lg,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodDetails: {
    marginLeft: SPACING.md,
  },
  methodText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  methodExpiry: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  defaultBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.success,
  },
  setDefaultButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  setDefaultButtonDisabled: {
    opacity: 0.6,
  },
  setDefaultButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  removeButton: {
    padding: SPACING.xs,
  },
});

export default PaymentMethodsScreen;

