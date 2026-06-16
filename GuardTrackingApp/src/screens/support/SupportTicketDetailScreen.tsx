import React, { useCallback, useState } from 'react';
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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { useRoleScreenHeader, RoleHeaderVariant } from '../../hooks/useRoleScreenHeader';
import supportApiService, { SupportTicketRecord } from '../../services/supportApiService';
import { RootState } from '../../store';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';
import { MessageCircle, Send } from 'react-native-feather';

interface RouteParams {
  ticketId: string;
  variant?: RoleHeaderVariant;
  mode?: 'mine' | 'inbox' | 'platform';
}

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const SupportTicketDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ticketId, variant = 'client', mode = 'mine' } = (route.params || {}) as RouteParams;
  const { user } = useSelector((state: RootState) => state.auth);
  const { headerProps } = useRoleScreenHeader('Support Ticket', variant);

  const [ticket, setTicket] = useState<SupportTicketRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isStaff =
    (variant === 'admin' && mode === 'inbox') ||
    (variant === 'superAdmin' && mode === 'platform');

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supportApiService.getTicketById(ticketId);
      setTicket(data);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useFocusEffect(
    useCallback(() => {
      loadTicket();
    }, [loadTicket]),
  );

  const handleSimpleReply = async () => {
    if (!reply.trim()) return;
    try {
      setSubmitting(true);
      await supportApiService.replyToTicket(ticketId, reply.trim());
      setReply('');
      await loadTicket();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChat = async () => {
    try {
      setSubmitting(true);
      const result = await supportApiService.openTicketChat(ticketId);
      navigation.navigate('IndividualChatScreen', {
        chatId: result.conversationId,
        chatName: ticket?.subject || 'Support',
        context: 'support',
      });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to open chat');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      setSubmitting(true);
      await supportApiService.updateTicketStatus(ticketId, status);
      await loadTicket();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !ticket) {
    return (
      <SafeAreaWrapper>
        <SharedHeader {...headerProps} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader {...headerProps} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.subject}>{ticket.subject}</Text>
          <Text style={styles.meta}>
            {ticket.category} · {ticket.status.replace('_', ' ')} ·{' '}
            {formatRelativeTime(new Date(ticket.createdAt))}
          </Text>
          {ticket.user && (
            <Text style={styles.meta}>
              From: {ticket.user.firstName} {ticket.user.lastName} ({ticket.user.role})
            </Text>
          )}
          <Text style={styles.body}>{ticket.message}</Text>
        </View>

        {(ticket.replies || []).map((r) => (
          <View
            key={r.id}
            style={[
              styles.replyCard,
              r.senderId === user?.id ? styles.replyOwn : styles.replyOther,
            ]}
          >
            <Text style={styles.replyAuthor}>
              {r.sender?.firstName} {r.sender?.lastName} · {formatRelativeTime(new Date(r.createdAt))}
            </Text>
            <Text style={styles.replyText}>{r.message}</Text>
          </View>
        ))}

        {ticket.status !== 'CLOSED' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Respond</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.chatBtn} onPress={handleOpenChat} disabled={submitting}>
                <MessageCircle width={18} height={18} color={COLORS.primary} />
                <Text style={styles.chatBtnText}>Open Live Chat</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={reply}
              onChangeText={setReply}
              placeholder="Type a simple reply…"
              placeholderTextColor={COLORS.textTertiary}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!reply.trim() || submitting) && styles.sendBtnDisabled]}
              onPress={handleSimpleReply}
              disabled={!reply.trim() || submitting}
            >
              <Send width={18} height={18} color={COLORS.textInverse} />
              <Text style={styles.sendBtnText}>Send Reply</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isStaff && (ticket.userId === user?.id || ticket.user?.id === user?.id) && ticket.status !== 'CLOSED' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Manage Ticket</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={styles.statusChip}
                onPress={() => handleStatusChange('CLOSED')}
                disabled={submitting}
              >
                <Text style={styles.statusChipText}>Close Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isStaff && ticket.status !== 'CLOSED' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusChip,
                    ticket.status === status && styles.statusChipActive,
                  ]}
                  onPress={() => handleStatusChange(status)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      ticket.status === status && styles.statusChipTextActive,
                    ]}
                  >
                    {status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  subject: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  meta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  body: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  replyCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  replyOwn: { backgroundColor: COLORS.primaryLight, alignSelf: 'flex-end', maxWidth: '92%' },
  replyOther: {
    backgroundColor: COLORS.backgroundPrimary,
    alignSelf: 'flex-start',
    maxWidth: '92%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  replyAuthor: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  replyText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textPrimary, lineHeight: 20 },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  actionRow: { marginBottom: SPACING.md },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'flex-start',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  chatBtnText: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    marginBottom: SPACING.sm,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statusChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundSecondary,
  },
  statusChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusChipText: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary },
  statusChipTextActive: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.fontWeight.semibold },
});

export default SupportTicketDetailScreen;
