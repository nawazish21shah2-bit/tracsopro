import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import SegmentTabs from '../../components/shifts/SegmentTabs';
import { useRoleScreenHeader, RoleHeaderVariant } from '../../hooks/useRoleScreenHeader';
import supportApiService, { SupportTicketRecord } from '../../services/supportApiService';
import { chatApi } from '../../services/api/chatApi';
import { EmptyState, InlineLoading } from '../../components/ui/LoadingStates';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { MessageCircle, Headphones, Plus } from 'react-native-feather';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

type HubTab = 'tickets' | 'chat';

interface SupportHubScreenProps {
  variant?: RoleHeaderVariant;
  /** admin: company inbox; superAdmin: platform inbox; others: my tickets */
  mode?: 'mine' | 'inbox' | 'platform';
}

export type SupportHubRouteParams = {
  variant?: RoleHeaderVariant;
  mode?: 'mine' | 'inbox' | 'platform';
};

const SupportHubScreen: React.FC<SupportHubScreenProps> = ({
  variant: propVariant,
  mode: propMode,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeParams = (route.params || {}) as SupportHubRouteParams;
  const variant = routeParams.variant ?? propVariant ?? 'admin';
  const mode = routeParams.mode ?? propMode;
  const resolvedMode =
    mode ??
    (variant === 'superAdmin' ? 'platform' : variant === 'admin' ? 'inbox' : 'mine');

  const title =
    resolvedMode === 'inbox'
      ? 'Support Inbox'
      : resolvedMode === 'platform'
        ? 'Platform Support'
        : 'Support Center';

  const { headerProps } = useRoleScreenHeader(title, variant);
  const canGoBack = navigation.canGoBack();
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };
  const [tab, setTab] = useState<HubTab>('tickets');
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = useCallback(async () => {
    if (resolvedMode === 'inbox') {
      const result = await supportApiService.getInbox(1, 50);
      setTickets(result.tickets);
    } else if (resolvedMode === 'platform') {
      const [inbox, chatsRes] = await Promise.all([
        supportApiService.getInbox(1, 50).catch(() => ({ tickets: [] })),
        chatApi.getSupportChats(),
      ]);
      setTickets(inbox.tickets);
      if (chatsRes.success) setChats(chatsRes.data || []);
    } else {
      const result = await supportApiService.getMyTickets(1, 50);
      setTickets(result.tickets);
    }
  }, [resolvedMode]);

  const loadChats = useCallback(async () => {
    const response = await chatApi.getSupportChats();
    if (response.success) {
      setChats(response.data || []);
    } else {
      setChats([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadTickets(), loadChats()]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to load support data');
    } finally {
      setLoading(false);
    }
  }, [loadTickets, loadChats]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const canSubmitTickets = variant !== 'superAdmin';

  const openNewTicket = () => {
    const route =
      variant === 'guard'
        ? 'GuardSupportContact'
        : variant === 'client'
          ? 'SupportContact'
          : 'AdminSupportContact';
    navigation.navigate(route);
  };

  const openTicket = (ticket: SupportTicketRecord) => {
    navigation.navigate('SupportTicketDetailScreen', {
      ticketId: ticket.id,
      variant,
      mode: resolvedMode,
    });
  };

  const openChat = async (chat?: any) => {
    if (chat?.id) {
      navigation.navigate('IndividualChatScreen', {
        chatId: chat.id,
        chatName: chat.name || 'Support',
        context: 'support',
      });
      return;
    }

    try {
      if (variant === 'admin' && resolvedMode === 'platform') {
        const res = await chatApi.openSupportChat();
        if (res.success && res.data) {
          navigation.navigate('IndividualChatScreen', {
            chatId: res.data.id,
            chatName: res.data.name || 'Platform Support',
            context: 'support',
          });
        } else {
          Alert.alert('Error', res.message || 'Failed to open support chat');
        }
      } else if (variant === 'superAdmin') {
        if (chat?.id) {
          navigation.navigate('IndividualChatScreen', {
            chatId: chat.id,
            chatName: chat.name || 'Support',
            context: 'support',
          });
        }
      } else if (variant === 'guard' || variant === 'client') {
        const res = await chatApi.openCompanySupportChat();
        if (res.success && res.data) {
          navigation.navigate('IndividualChatScreen', {
            chatId: res.data.id || res.data.conversationId,
            chatName: res.data.name || 'Company Support',
            context: 'support',
          });
        } else {
          Alert.alert('Error', res.message || 'Failed to open company support chat');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to open support chat');
    }
  };

  const renderTicket = ({ item }: { item: SupportTicketRecord }) => (
    <TouchableOpacity style={styles.card} onPress={() => openTicket(item)} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.subject}</Text>
        <View style={[styles.badge, badgeStyle(item.status)]}>
          <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      {item.user && resolvedMode !== 'mine' && (
        <Text style={styles.meta}>
          {item.user.firstName} {item.user.lastName} · {item.user.role}
        </Text>
      )}
      <Text style={styles.preview} numberOfLines={2}>{item.message}</Text>
      <Text style={styles.date}>{formatRelativeTime(new Date(item.createdAt))}</Text>
    </TouchableOpacity>
  );

  const renderChat = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openChat(item)} activeOpacity={0.85}>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name || 'Support Chat'}</Text>
      <Text style={styles.preview} numberOfLines={2}>
        {item.lastMessage?.content || 'Tap to open conversation'}
      </Text>
      {item.lastMessageAt && (
        <Text style={styles.date}>{formatRelativeTime(new Date(item.lastMessageAt))}</Text>
      )}
    </TouchableOpacity>
  );

  const showChatTab = variant === 'admin' || variant === 'superAdmin' || variant === 'guard' || variant === 'client';

  return (
    <SafeAreaWrapper>
      <SharedHeader
        {...headerProps}
        showBackButton={canGoBack}
        onBackPress={handleBackPress}
        onMenuPress={canGoBack ? undefined : headerProps.onMenuPress}
        hideProfileDrawer={canGoBack}
      />
      {showChatTab && (
        <SegmentTabs
          tabs={[
            { key: 'tickets', label: resolvedMode === 'mine' ? 'My Tickets' : 'Tickets' },
            { key: 'chat', label: 'Live Chat' },
          ]}
          activeKey={tab}
          onChange={(key) => setTab(key as HubTab)}
        />
      )}

      {canSubmitTickets && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={openNewTicket}>
            <Plus width={18} height={18} color={COLORS.textInverse} />
            <Text style={styles.primaryBtnText}>Submit Ticket</Text>
          </TouchableOpacity>
          {tab === 'chat' && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => openChat()}>
              <MessageCircle width={18} height={18} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>Open Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!canSubmitTickets && tab === 'chat' && (
        <View style={styles.actions}>
          <Text style={styles.superAdminHint}>
            Respond to admin support requests from the tickets or live chat lists below.
          </Text>
        </View>
      )}

      {loading ? (
        <InlineLoading message="Loading support…" />
      ) : tab === 'tickets' ? (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={tickets.length === 0 ? styles.emptyWrap : styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No tickets yet"
              message={
                variant === 'superAdmin'
                  ? 'Admin support tickets will appear here when company admins submit requests.'
                  : 'Submit a support ticket or start a live chat.'
              }
              icon={<Headphones width={40} height={40} color={COLORS.textTertiary} />}
            />
          }
        />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={chats.length === 0 ? styles.emptyWrap : styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No chats yet"
              message="Open a support chat to talk with your support team."
              actionText="Open Chat"
              onAction={() => openChat()}
              icon={<MessageCircle width={40} height={40} color={COLORS.textTertiary} />}
            />
          }
        />
      )}
    </SafeAreaWrapper>
  );
};

function badgeStyle(status: string) {
  switch (status) {
    case 'OPEN':
      return { backgroundColor: '#FFF3E0' };
    case 'IN_PROGRESS':
      return { backgroundColor: COLORS.primaryLight };
    case 'RESOLVED':
    case 'CLOSED':
      return { backgroundColor: '#E8F5E9' };
    default:
      return { backgroundColor: COLORS.backgroundSecondary };
  }
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundPrimary,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  superAdminHint: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingVertical: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  meta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  preview: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  date: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
});

export default SupportHubScreen;
