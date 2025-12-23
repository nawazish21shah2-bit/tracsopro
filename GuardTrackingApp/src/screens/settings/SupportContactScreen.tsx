import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { settingsService, SupportTicketData } from '../../services/settingsService';
import { HelpCircle } from 'react-native-feather';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { SettingsStackParamList } from '../../navigation/DashboardNavigator';

interface SupportContactScreenProps {
  variant?: 'client' | 'guard' | 'admin';
  profileDrawer?: React.ReactNode;
  onSuccess?: () => void;
}

const SUPPORT_CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'urgent', label: 'Urgent Issue' },
] as const;

const SupportContactScreen: React.FC<SupportContactScreenProps> = ({
  variant = 'client',
  profileDrawer,
  onSuccess,
}) => {
  const navigation = useNavigation<StackNavigationProp<SettingsStackParamList>>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<SupportTicketData>({
    subject: '',
    message: '',
    category: 'general',
  });

  // Create drawer for guard variant if not provided
  const renderProfileDrawer = () => {
    if (profileDrawer) return profileDrawer;
    
    if (variant === 'guard') {
      return (
        <GuardProfileDrawer
          visible={isDrawerVisible}
          onClose={closeDrawer}
          onNavigateToProfile={() => {
            closeDrawer();
            navigation.navigate('GuardProfileEdit');
          }}
          onNavigateToNotifications={() => {
            closeDrawer();
            navigation.navigate('GuardNotificationSettings');
          }}
          onNavigateToSupport={() => {
            closeDrawer();
            // Already on support contact
          }}
        />
      );
    }
    
    return null;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject');
      return;
    }
    if (!formData.message.trim()) {
      Alert.alert('Validation Error', 'Please enter a message');
      return;
    }
    if (formData.subject.trim().length > 200) {
      Alert.alert('Validation Error', 'Subject must be 200 characters or less');
      return;
    }
    if (formData.message.trim().length > 5000) {
      Alert.alert('Validation Error', 'Message must be 5000 characters or less');
      return;
    }

    try {
      setSubmitting(true);
      await settingsService.submitSupportRequest(formData);
      Alert.alert(
        'Success',
        'Your support request has been submitted. We will get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({ subject: '', message: '', category: 'general' });
              onSuccess?.();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting support request:', error);
      const errorMessage = error?.message || 'Failed to submit support request. Please try again.';
      
      // If it's a session expired error, show a more user-friendly message
      if (errorMessage.includes('session has expired') || errorMessage.includes('expired')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader variant={variant} title="Contact Support" profileDrawer={renderProfileDrawer()} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <HelpCircle width={24} height={24} color="#1C6CA9" />
            <Text style={styles.headerText}>We're here to help</Text>
          </View>
          <Text style={styles.description}>
            Please describe your issue or question, and we'll get back to you as soon as possible.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryContainer}>
            {SUPPORT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryButton,
                  formData.category === category.value && styles.categoryButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, category: category.value })}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    formData.category === category.value && styles.categoryButtonTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
            placeholder="Brief description of your issue"
            placeholderTextColor="#999"
            maxLength={200}
          />
          <Text style={styles.helperText}>
            {formData.subject.length}/200 characters
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            placeholder="Please provide details about your issue or question..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={5000}
          />
          <Text style={styles.helperText}>
            {formData.message.length}/5000 characters
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  categoryButtonActive: {
    backgroundColor: '#1C6CA9',
    borderColor: '#1C6CA9',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#1C6CA9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SupportContactScreen;

