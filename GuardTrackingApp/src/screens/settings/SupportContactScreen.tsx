import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import FormInput from '../../components/common/FormInput';
import { HelpCircle, ChevronRight } from 'react-native-feather';
import { useRoleScreenHeader, RoleHeaderVariant } from '../../hooks/useRoleScreenHeader';
import supportApiService, { SupportTicketRecord } from '../../services/supportApiService';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

interface SupportContactScreenProps {
  variant?: RoleHeaderVariant;
  profileDrawer?: React.ReactNode;
  onSuccess?: () => void;
}

export interface SupportTicketData {
  subject: string;
  message: string;
  category: string;
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
  const navigation = useNavigation<any>();
  const { headerProps: roleHeaderProps } = useRoleScreenHeader('Contact Support', variant);
  const headerProps = profileDrawer
    ? { ...roleHeaderProps, profileDrawer, onMenuPress: roleHeaderProps.onMenuPress }
    : roleHeaderProps;

  const [submitting, setSubmitting] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [formData, setFormData] = useState<SupportTicketData>({
    subject: '',
    message: '',
    category: 'general',
  });

  const ticketAudience =
    variant === 'admin' || variant === 'superAdmin' ? 'PLATFORM' : 'COMPANY';

  const loadTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const result = await supportApiService.getMyTickets(1, 10);
      setTickets(result.tickets);
    } catch {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets]),
  );

  const openTicket = (ticket: SupportTicketRecord) => {
    navigation.navigate('SupportTicketDetailScreen', {
      ticketId: ticket.id,
      variant,
      mode: 'mine',
    });
  };

  const openSupportHub = () => {
    const mode =
      variant === 'admin'
        ? 'inbox'
        : variant === 'superAdmin'
          ? 'platform'
          : 'mine';
    navigation.navigate('SupportHubScreen', { variant, mode });
  };

  const handleSubmit = async () => {
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
      const created = await supportApiService.createTicket({
        ...formData,
        audience: ticketAudience,
      });
      setFormData({ subject: '', message: '', category: 'general' });
      await loadTickets();
      onSuccess?.();
      Alert.alert('Success', 'Your support request has been submitted.', [
        { text: 'View Ticket', onPress: () => openTicket(created) },
        { text: 'OK' },
      ]);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit support request.';
      if (errorMessage.includes('session has expired') || errorMessage.includes('expired')) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader {...headerProps} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.hubLink} onPress={openSupportHub} activeOpacity={0.85}>
          <Text style={styles.hubLinkText}>Open Support Center</Text>
          <ChevronRight width={18} height={18} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My Submitted Tickets</Text>
          {loadingTickets ? (
            <ActivityIndicator color={COLORS.primary} style={styles.ticketLoader} />
          ) : tickets.length === 0 ? (
            <Text style={styles.emptyText}>No tickets yet. Submit a request below.</Text>
          ) : (
            tickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketRow}
                onPress={() => openTicket(ticket)}
                activeOpacity={0.85}
              >
                <View style={styles.ticketRowMain}>
                  <Text style={styles.ticketSubject} numberOfLines={1}>
                    {ticket.subject}
                  </Text>
                  <Text style={styles.ticketMeta}>
                    {ticket.status.replace('_', ' ')} · {formatRelativeTime(new Date(ticket.createdAt))}
                  </Text>
                </View>
                <ChevronRight width={16} height={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.header}>
            <HelpCircle width={24} height={24} color={COLORS.primary} />
            <Text style={styles.headerText}>Submit a new request</Text>
          </View>
          <Text style={styles.description}>
            {variant === 'admin' || variant === 'superAdmin'
              ? 'Contact platform support about billing, technical issues, or account help.'
              : 'Describe your issue and your company admin will respond via ticket or live chat.'}
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
          <FormInput
            label="Subject"
            required
            icon="edit"
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
            placeholder="Brief description of your issue"
            maxLength={200}
            helperText={`${formData.subject.length}/200 characters`}
          />
        </View>

        <View style={styles.card}>
          <FormInput
            label="Message"
            required
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            placeholder="Please provide details about your issue or question..."
            multiline
            numberOfLines={8}
            maxLength={5000}
            helperText={`${formData.message.length}/5000 characters`}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.textInverse} />
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
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.lg,
  },
  hubLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  hubLinkText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  ticketLoader: { paddingVertical: SPACING.md },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  ticketRowMain: { flex: 1, marginRight: SPACING.sm },
  ticketSubject: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  ticketMeta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundPrimary,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  categoryButtonTextActive: {
    color: COLORS.textInverse,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundPrimary,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default SupportContactScreen;
