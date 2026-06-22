/**
 * User Management Screen - Admin user management
 * Manage guards, clients, and admin users with role-based permissions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { UserIcon, UsersIcon, PlusIcon } from '../../components/ui/AppIcons';
import {
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  MessageCircleIcon,
} from '../../components/ui/FeatherIcons';
import { adminApi } from '../../services/api/adminApi';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { showActionErrorAlert } from '../../utils/subscriptionLimitAlert';
import { SubscriptionResource } from '../../utils/subscriptionUtils';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { RefreshControl } from 'react-native';
import { findOrCreateAdminGuardChat, findOrCreateClientAdminChat } from '../../utils/chatHelper';
import { useUserList, UserListItem } from '../../features/user-management/hooks/useUserList';
import FormInput from '../../components/common/FormInput';

type User = UserListItem;

interface UserManagementScreenProps {
  navigation: any;
}

/** Split a display name into first/last without duplicating single-word names. */
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: 'AdminNotifications',
  });
  const { ensureCanAdd, refresh: refreshLimits } = useSubscriptionLimits();
  const insets = useSafeAreaInsets();

  // Tab bar height is 70px, add safe area bottom inset and spacing
  const TAB_BAR_HEIGHT = 0; // Removed extra height
  const BUTTON_SPACING = 16;
  const buttonBottom = TAB_BAR_HEIGHT + insets.bottom + BUTTON_SPACING;

  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'guard' | 'client'>('all');
  const { users, loading, error, refresh: loadUsers, setUsers } = useUserList(selectedRole);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'guard' as User['role'],
    department: '',
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: 'guard' as User['role'],
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const userResource = (role: User['role']): SubscriptionResource | null => {
    if (role === 'guard') return 'guards';
    if (role === 'client') return 'clients';
    return null;
  };

  const handleOpenCreateModal = async () => {
    const resource = userResource(newUser.role);
    if (resource) {
      const allowed = await ensureCanAdd(resource, navigation);
      if (!allowed) return;
    }
    setShowCreateModal(true);
  };

  const handleCreateUser = async () => {
    if (creatingUser) return;

    if (!newUser.name?.trim() || !newUser.email?.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Map UI role to backend role enum
    const roleMap: Record<User['role'], 'GUARD' | 'ADMIN' | 'CLIENT'> = {
      admin: 'ADMIN',
      guard: 'GUARD',
      client: 'CLIENT',
    };

    const { firstName, lastName } = splitFullName(newUser.name);

    // Generate temporary password
    const tempPassword = `Temp${Math.floor(100000 + Math.random() * 900000)}!`;

    const resource = userResource(newUser.role);
    if (resource) {
      const allowed = await ensureCanAdd(resource, navigation);
      if (!allowed) return;
    }

    setCreatingUser(true);
    try {
      const response = await adminApi.createAdminUser({
        email: newUser.email.trim().toLowerCase(),
        password: tempPassword,
        firstName,
        lastName,
        role: roleMap[newUser.role],
        department: newUser.department || undefined,
      });

      if (!response.success) {
        showActionErrorAlert('Create User', response.message || 'Failed to create user', {
          role: user?.role,
          onUpgrade: () => navigation.navigate('AdminSubscription'),
        });
        return;
      }

      // Add user to list
      const userData = response.data;
      const createdUser: User = {
        id: userData.id,
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email,
        role: newUser.role,
        status: 'active',
        department: newUser.department || undefined,
        createdAt: userData.createdAt,
      };

      setUsers(prev => [createdUser, ...prev]);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', role: 'guard', department: '' });
      await refreshLimits();

      Alert.alert(
        'User Created',
        `User has been created successfully.\n\nEmail: ${newUser.email}\nTemporary Password: ${tempPassword}\n\nPlease share this password with the user.`
      );
    } catch (error: any) {
      console.error('Create user error:', error);
      showActionErrorAlert('Create User', error, {
        role: user?.role,
        onUpgrade: () => navigation.navigate('AdminSubscription'),
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'edit' | 'suspend' | 'activate' | 'delete') => {
    if (actionLoading === userId) return;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'suspend':
        Alert.alert(
          'Suspend User',
          `Are you sure you want to suspend ${user.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Suspend',
              style: 'destructive',
              onPress: () => updateUserStatus(userId, false),
            },
          ]
        );
        break;
      case 'activate':
        updateUserStatus(userId, true);
        break;
      case 'delete':
        Alert.alert(
          'Delete User',
          `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteUser(userId),
            },
          ]
        );
        break;
      case 'edit':
        setEditingUserId(user.id);
        setEditUser({
          name: user.name,
          email: user.email,
          role: user.role,
        });
        setShowEditModal(true);
        break;
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      const response = await adminApi.updateAdminUserStatus(userId, isActive);
      if (!response.success) {
        Alert.alert('Error', response.message || `Failed to ${isActive ? 'activate' : 'suspend'} user`);
        return;
      }
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, status: isActive ? 'active' : 'suspended' } : u
      ));
    } catch (error: any) {
      console.error('Update status error:', error);
      Alert.alert('Error', error.message || `Failed to ${isActive ? 'activate' : 'suspend'} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await adminApi.deleteAdminUser(userId);
      if (!response.success) {
        Alert.alert('Error', response.message || 'Failed to delete user');
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      console.error('Delete user error:', error);
      Alert.alert('Error', error.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEditUser = async () => {
    if (updatingUser || !editingUserId) return;

    if (!editUser.name?.trim() || !editUser.email?.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const roleMap: Record<User['role'], 'GUARD' | 'ADMIN' | 'CLIENT'> = {
      admin: 'ADMIN',
      guard: 'GUARD',
      client: 'CLIENT',
    };

    const { firstName, lastName } = splitFullName(editUser.name);

    setUpdatingUser(true);
    try {
      const response = await adminApi.updateAdminUser(editingUserId, {
        firstName,
        lastName,
        email: editUser.email.trim().toLowerCase(),
        role: roleMap[editUser.role],
      });

      if (!response.success || !response.data) {
        Alert.alert('Error', response.message || 'Failed to update user');
        return;
      }

      const roleMapBack: Record<string, User['role']> = {
        ADMIN: 'admin',
        GUARD: 'guard',
        CLIENT: 'client',
      };

      setUsers(prev => prev.map(u =>
        u.id === editingUserId
          ? {
            ...u,
            name: editUser.name,
            email: editUser.email.trim().toLowerCase(),
            role: roleMapBack[response.data.role] || editUser.role,
          }
          : u
      ));

      setShowEditModal(false);
      setEditingUserId(null);
      Alert.alert('Success', 'User updated successfully');
    } catch (error: any) {
      console.error('Edit user error:', error);
      Alert.alert('Error', error.message || 'Failed to update user');
    } finally {
      setUpdatingUser(false);
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return COLORS.error;
      case 'guard': return COLORS.primary;
      case 'client': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'inactive': return COLORS.textSecondary;
      case 'suspended': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const filteredUsers = selectedRole === 'all'
    ? users
    : users.filter(u => u.role === selectedRole);

  const ACTION_ICON_SIZE = 14;
  const isItemLoading = (userId: string) => actionLoading === userId;

  const renderUserCardAction = (
    label: string,
    onPress: () => void,
    icon: React.ReactNode,
    options?: {
      variant?: 'primary' | 'warning' | 'success' | 'danger';
      disabled?: boolean;
    }
  ) => {
    const variant = options?.variant ?? 'primary';
    const disabled = options?.disabled ?? false;

    const variantBtnStyle =
      variant === 'warning'
        ? styles.cardActionBtnWarning
        : variant === 'success'
          ? styles.cardActionBtnSuccess
          : variant === 'danger'
            ? styles.cardActionBtnDanger
            : undefined;

    const variantTextStyle =
      variant === 'warning'
        ? styles.cardActionBtnTextWarning
        : variant === 'success'
          ? styles.cardActionBtnTextSuccess
          : variant === 'danger'
            ? styles.cardActionBtnTextDanger
            : styles.cardActionBtnText;

    return (
      <TouchableOpacity
        style={[
          styles.cardActionBtn,
          variantBtnStyle,
          disabled && styles.cardActionBtnDisabled,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {icon}
        <Text
          style={[variantTextStyle, disabled && styles.cardActionBtnTextDisabled]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleUserChat = async (item: User) => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      let chatParams;
      if (item.role === 'guard') {
        chatParams = await findOrCreateAdminGuardChat(user.id, item.id, item.name);
      } else if (item.role === 'client') {
        chatParams = await findOrCreateClientAdminChat(item.id, user.id, item.name);
      }

      if (chatParams) {
        navigation.navigate('IndividualChatScreen', chatParams);
      } else {
        Alert.alert('Error', 'Could not initiate chat');
      }
    } catch (error: any) {
      console.error('Error initiating chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const loading = isItemLoading(item.id);
    const muted = COLORS.textSecondary;

    return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>

        <View style={styles.userBadges}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {item.department && (
        <View style={styles.departmentContainer}>
          <Text style={styles.userDepartment}>Department: {item.department}</Text>
        </View>
      )}

      <View style={styles.userMeta}>
        <Text style={styles.metaText}>
          Created: {new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
        {item.lastLogin && (
          <Text style={styles.metaText}>
            Last login: {new Date(item.lastLogin).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        )}
      </View>

      <View style={styles.userActions}>
        {(item.role === 'guard' || item.role === 'client') &&
          renderUserCardAction(
            'Chat',
            () => handleUserChat(item),
            <MessageCircleIcon size={ACTION_ICON_SIZE} color={COLORS.primary} />,
          )}

        {renderUserCardAction(
          'Edit',
          () => handleUserAction(item.id, 'edit'),
          <EditIcon size={ACTION_ICON_SIZE} color={loading ? muted : COLORS.primary} />,
          { disabled: loading },
        )}

        {item.status === 'active'
          ? renderUserCardAction(
              'Suspend',
              () => handleUserAction(item.id, 'suspend'),
              <AlertTriangleIcon size={ACTION_ICON_SIZE} color={loading ? muted : COLORS.warning} />,
              { variant: 'warning', disabled: loading },
            )
          : renderUserCardAction(
              'Activate',
              () => handleUserAction(item.id, 'activate'),
              <CheckCircleIcon size={ACTION_ICON_SIZE} color={loading ? muted : COLORS.success} />,
              { variant: 'success', disabled: loading },
            )}

        {renderUserCardAction(
          'Delete',
          () => handleUserAction(item.id, 'delete'),
          <TrashIcon size={ACTION_ICON_SIZE} color={loading ? muted : COLORS.error} />,
          { variant: 'danger', disabled: loading },
        )}
      </View>
    </View>
    );
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="User Management"
        showLogo={false}
        onMenuPress={openDrawer}
        onNotificationPress={onNotificationPress}
        notificationCount={notificationCount}
        profileDrawer={
          <AdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToUserManagement={() => {
              closeDrawer();
            }}
          />
        }
      />

      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All Users', icon: UsersIcon },
          { key: 'admin', label: 'Admin', icon: UserIcon },
          { key: 'guard', label: 'Guards', icon: UserIcon },
          { key: 'client', label: 'Clients', icon: UserIcon },
        ].map((role) => {
          const isActive = selectedRole === role.key;
          const IconComponent = role.icon;
          const iconColor = isActive ? COLORS.textInverse : '#7A7A7A';
          return (
            <TouchableOpacity
              key={role.key}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedRole(role.key as any)}
            >
              <View style={styles.filterIcon}>
                <IconComponent size={16} color={iconColor} />
              </View>
              <Text style={[
                styles.filterText,
                isActive && styles.filterTextActive,
              ]}>
                {role.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.contentWrapper}>
        {loading && !users.length ? (
          <LoadingOverlay visible={true} message="Loading users..." />
        ) : error && !users.length ? (
          <View style={styles.errorContainer}>
            {error.toLowerCase().includes('network') || error.toLowerCase().includes('timeout') || error.toLowerCase().includes('connection') ? (
              <NetworkError onRetry={loadUsers} />
            ) : (
              <ErrorState error={error} onRetry={loadUsers} />
            )}
          </View>
        ) : (
          <FlatList
            testID="admin-user-management-screen"
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
          />
        )}
      </View>

      {loading && users.length > 0 && <LoadingOverlay visible={true} message="Refreshing..." />}

      {/* Sticky Action Button */}
      <TouchableOpacity
        style={[
          styles.stickyAddButton,
          { bottom: buttonBottom },
          (creatingUser || updatingUser) && styles.stickyAddButtonDisabled
        ]}
        onPress={handleOpenCreateModal}
        disabled={creatingUser || updatingUser}
        activeOpacity={(creatingUser || updatingUser) ? 1 : 0.7}
      >
        <PlusIcon size={18} color={COLORS.textInverse} style={styles.stickyAddButtonIcon} />
        <Text style={styles.stickyAddButtonText}>Add User</Text>
      </TouchableOpacity>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New User</Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              disabled={creatingUser}
              activeOpacity={creatingUser ? 1 : 0.7}
            >
              <Text style={[styles.closeButton, creatingUser && styles.closeButtonDisabled]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <FormInput
              label="Full Name"
              value={newUser.name}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, name: text }))}
              placeholder="Enter full name"
              editable={!creatingUser}
              containerStyle={styles.formField}
            />

            <FormInput
              label="Email"
              icon="mail-outline"
              value={newUser.email}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, email: text }))}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!creatingUser}
              containerStyle={styles.formField}
            />

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {['guard', 'client'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      newUser.role === role && styles.roleOptionSelected,
                      creatingUser && styles.roleOptionDisabled,
                    ]}
                    onPress={() => setNewUser(prev => ({ ...prev, role: role as User['role'] }))}
                    disabled={creatingUser}
                    activeOpacity={creatingUser ? 1 : 0.7}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      newUser.role === role && styles.roleOptionTextSelected,
                    ]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {newUser.role === 'guard' && (
              <FormInput
                label="Department"
                value={newUser.department}
                onChangeText={(text) => setNewUser(prev => ({ ...prev, department: text }))}
                placeholder="Enter department"
                editable={!creatingUser}
                containerStyle={styles.formField}
              />
            )}

            <TouchableOpacity
              style={[styles.createButton, creatingUser && styles.createButtonDisabled]}
              onPress={handleCreateUser}
              disabled={creatingUser}
              activeOpacity={creatingUser ? 1 : 0.7}
            >
              <Text style={styles.createButtonText}>
                {creatingUser ? 'Creating User...' : 'Create User'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                setEditingUserId(null);
              }}
              disabled={updatingUser}
              activeOpacity={updatingUser ? 1 : 0.7}
            >
              <Text style={[styles.closeButton, updatingUser && styles.closeButtonDisabled]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <FormInput
              label="Full Name"
              value={editUser.name}
              onChangeText={(text) => setEditUser(prev => ({ ...prev, name: text }))}
              placeholder="Enter full name"
              editable={!updatingUser}
              containerStyle={styles.formField}
            />

            <FormInput
              label="Email"
              icon="mail-outline"
              value={editUser.email}
              onChangeText={(text) => setEditUser(prev => ({ ...prev, email: text }))}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!updatingUser}
              containerStyle={styles.formField}
            />

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {['guard', 'client'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      editUser.role === role && styles.roleOptionSelected,
                      updatingUser && styles.roleOptionDisabled,
                    ]}
                    onPress={() => setEditUser(prev => ({ ...prev, role: role as User['role'] }))}
                    disabled={updatingUser}
                    activeOpacity={updatingUser ? 1 : 0.7}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        editUser.role === role && styles.roleOptionTextSelected,
                      ]}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createButton, updatingUser && styles.createButtonDisabled]}
              onPress={handleSaveEditUser}
              disabled={updatingUser}
              activeOpacity={updatingUser ? 1 : 0.7}
            >
              <Text style={styles.createButtonText}>
                {updatingUser ? 'Saving Changes...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    marginTop: 50,
  },
  backButton: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  headerTitle: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  stickyAddButton: {
    position: 'absolute',
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
    zIndex: 1000,
  },
  stickyAddButtonIcon: {
    marginRight: SPACING.xs,
  },
  stickyAddButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: '#ECECEC',
    gap: SPACING.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#7A7A7A',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: 110, // Space for floating CTA + bottom nav
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  userCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // No shadow - border only for minimal style
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  userBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  departmentContainer: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  userDepartment: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  userMeta: {
    marginBottom: SPACING.sm,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  cardActionBtn: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.backgroundSecondary,
    gap: SPACING.xs / 2,
  },
  cardActionBtnWarning: {
    borderColor: COLORS.warning,
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
  },
  cardActionBtnSuccess: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  cardActionBtnDanger: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  cardActionBtnDisabled: {
    opacity: 0.55,
  },
  cardActionBtnText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  cardActionBtnTextWarning: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.warning,
  },
  cardActionBtnTextSuccess: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  cardActionBtnTextDanger: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.error,
  },
  cardActionBtnTextDisabled: {
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    color: COLORS.textSecondary,
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  stickyAddButtonDisabled: {
    opacity: 0.6,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.formPadding || SPACING.lg,
  },
  formField: {
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  fieldInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  roleOption: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  roleOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleOptionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  roleOptionTextSelected: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  roleOptionDisabled: {
    opacity: 0.5,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sectionGap || SPACING.xl,
    ...SHADOWS.small,
  },
  createButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
});

export default UserManagementScreen;
