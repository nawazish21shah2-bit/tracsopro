import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { X, Search, User } from 'react-native-feather';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import apiService from '../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface UserOption {
  id: string;
  userId: string;
  name: string;
  role: 'ADMIN' | 'GUARD' | 'CLIENT';
  avatar?: string;
}

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, userName: string, userRole: string) => void;
  currentUserRole?: string;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  visible,
  onClose,
  onSelectUser,
  currentUserRole,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    if (visible) {
      loadAvailableUsers();
    } else {
      setSearchQuery('');
      setUsers([]);
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      
      // Get available users based on current user's role
      const availableUsers: UserOption[] = [];

      if (currentUserRole === 'ADMIN') {
        // Admins can chat with guards and clients
        const [guardsResponse, clientsResponse] = await Promise.all([
          apiService.getGuards(1, 100),
          apiService.getClients(1, 100),
        ]);

        if (guardsResponse.success && guardsResponse.data) {
          const guards = (guardsResponse.data as any).items || [];
          guards.forEach((guard: any) => {
            if (guard.user && guard.user.id !== user?.id) {
              const guardName = `${guard.user.firstName || ''} ${guard.user.lastName || ''}`.trim();
              availableUsers.push({
                id: guard.id,
                userId: guard.user.id,
                name: guardName || guard.user.email || `Guard ${guard.id}`,
                role: 'GUARD',
                avatar: guard.profilePictureUrl,
              });
            }
          });
        }

        if (clientsResponse.success && clientsResponse.data) {
          const clients = (clientsResponse.data as any).items || [];
          clients.forEach((client: any) => {
            if (client.user && client.user.id !== user?.id) {
              const clientName = `${client.user.firstName || ''} ${client.user.lastName || ''}`.trim();
              availableUsers.push({
                id: client.id,
                userId: client.user.id,
                name: clientName || client.user.email || `Client ${client.id}`,
                role: 'CLIENT',
              });
            }
          });
        }
      } else if (currentUserRole === 'CLIENT') {
        // Clients can chat with guards assigned to their sites
        const sitesResponse = await apiService.getClientSites(1, 100);
        if (sitesResponse.success && sitesResponse.data?.sites) {
          // Get guards from shifts at client's sites
          // This is already handled in getUserChats, but we can also show them here
          // For now, we'll get guards from the chat list
          const chatsResponse = await apiService.getChatRooms();
          if (chatsResponse.success && chatsResponse.data) {
            const chats = chatsResponse.data as any[];
            chats.forEach((chat: any) => {
              if (chat.participants) {
                chat.participants.forEach((participant: any) => {
                  if (
                    participant.userId !== user?.id &&
                    participant.user?.role === 'GUARD' &&
                    !availableUsers.find((u) => u.userId === participant.userId)
                  ) {
                    availableUsers.push({
                      id: participant.userId,
                      userId: participant.userId,
                      name: `${participant.user.firstName} ${participant.user.lastName}`.trim(),
                      role: 'GUARD',
                      avatar: participant.user.avatar,
                    });
                  }
                });
              }
            });
          }
        }
      } else if (currentUserRole === 'GUARD') {
        // Guards can see admins and clients from their chats
        const chatsResponse = await apiService.getChatRooms();
        if (chatsResponse.success && chatsResponse.data) {
          const chats = chatsResponse.data as any[];
          chats.forEach((chat: any) => {
            if (chat.participants) {
              chat.participants.forEach((participant: any) => {
                if (
                  participant.userId !== user?.id &&
                  (participant.user?.role === 'ADMIN' || participant.user?.role === 'CLIENT') &&
                  !availableUsers.find((u) => u.userId === participant.userId)
                ) {
                  availableUsers.push({
                    id: participant.userId,
                    userId: participant.userId,
                    name: `${participant.user.firstName} ${participant.user.lastName}`.trim(),
                    role: participant.user.role,
                    avatar: participant.user.avatar,
                  });
                }
              });
            }
          });
        }
      }

      setUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (error) {
      console.error('Error loading available users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (selectedUser: UserOption) => {
    onSelectUser(selectedUser.userId, selectedUser.name, selectedUser.role);
    onClose();
  };

  const renderUserItem = ({ item }: { item: UserOption }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleSelectUser(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User width={24} height={24} color={COLORS.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Chat</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X width={24} height={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search width={20} height={20} color={COLORS.textTertiary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>

          {/* User List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.userId}
              style={styles.userList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found</Text>
                  <Text style={styles.emptySubtext}>
                    {searchQuery
                      ? 'Try a different search term'
                      : 'No available users to chat with'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    padding: SPACING.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  userRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default NewChatModal;

