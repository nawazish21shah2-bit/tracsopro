/**
 * User Management Screen - Admin user management
 * Manage guards, clients, and admin users with role-based permissions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { UserIcon, UsersIcon, SettingsIcon, EmergencyIcon } from '../../components/ui/AppIcons';
import apiService from '../../services/api';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'guard' | 'client';
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  lastLogin?: string;
  createdAt: string;
}

interface UserManagementScreenProps {
  navigation: any;
}

const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'guard' | 'client'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await apiService.getAdminUsers();

      if (!response.success || !response.data) {
        console.warn('Failed to load users:', response.message);
        return;
      }

      const backendUsers = response.data.users as any[];

      const mappedUsers: User[] = backendUsers.map((u) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
        const roleMap: Record<string, User['role']> = {
          ADMIN: 'admin',
          GUARD: 'guard',
          CLIENT: 'client',
        };

        return {
          id: u.id,
          name: fullName,
          email: u.email,
          role: roleMap[u.role] || 'guard',
          status: u.isActive ? 'active' : 'inactive',
          department: u.guard?.department,
          createdAt: u.createdAt,
          lastLogin: undefined,
        };
      });

      setUsers(mappedUsers);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', error.message || 'Failed to load users');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Map UI role to backend role enum
    const roleMap: Record<User['role'], 'GUARD' | 'ADMIN' | 'CLIENT'> = {
      admin: 'ADMIN',
      guard: 'GUARD',
      client: 'CLIENT',
    };

    const [firstName, ...rest] = newUser.name.trim().split(' ');
    const lastName = rest.join(' ');

    // Generate a simple temporary password for the new user
    const tempPassword = `Temp${Math.floor(100000 + Math.random() * 900000)}!`;

    try {
      const response = await apiService.register({
        email: newUser.email.trim().toLowerCase(),
        password: tempPassword,
        firstName,
        lastName: lastName || firstName,
        role: roleMap[newUser.role],
      } as any);

      if (!response.success || !response.data) {
        Alert.alert('Error', response.message || 'Failed to create user');
        return;
      }

      const createdAt = new Date().toISOString();

      const user: User = {
        id: response.data.userId || `user_${Date.now()}`,
        name: newUser.name,
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
        status: 'active',
        department: newUser.department || undefined,
        createdAt,
      };

      setUsers(prev => [...prev, user]);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', role: 'guard', department: '' });

      Alert.alert(
        'User created',
        `User has been created successfully. Temporary password: ${tempPassword}`
      );
    } catch (error: any) {
      console.error('Admin create user error:', error);
      Alert.alert('Error', error.message || 'Failed to create user');
    }
  };

  const handleUserAction = async (userId: string, action: 'edit' | 'suspend' | 'activate' | 'delete') => {
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
              onPress: async () => {
                try {
                  const response = await apiService.updateAdminUserStatus(userId, false);
                  if (!response.success) {
                    Alert.alert('Error', response.message || 'Failed to suspend user');
                    return;
                  }
                  setUsers(prev => prev.map(u => 
                    u.id === userId ? { ...u, status: 'suspended' } : u
                  ));
                } catch (error: any) {
                  console.error('Suspend user error:', error);
                  Alert.alert('Error', error.message || 'Failed to suspend user');
                }
              }
            },
          ]
        );
        break;
      case 'activate':
        try {
          const response = await apiService.updateAdminUserStatus(userId, true);
          if (!response.success) {
            Alert.alert('Error', response.message || 'Failed to activate user');
            return;
          }
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, status: 'active' } : u
          ));
        } catch (error: any) {
          console.error('Activate user error:', error);
          Alert.alert('Error', error.message || 'Failed to activate user');
        }
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
              onPress: async () => {
                try {
                  const response = await apiService.deleteAdminUser(userId);
                  if (!response.success) {
                    Alert.alert('Error', response.message || 'Failed to delete user');
                    return;
                  }
                  setUsers(prev => prev.filter(u => u.id !== userId));
                } catch (error: any) {
                  console.error('Delete user error:', error);
                  Alert.alert('Error', error.message || 'Failed to delete user');
                }
              }
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

  const handleSaveEditUser = async () => {
    if (!editingUserId) return;

    if (!editUser.name || !editUser.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const roleMap: Record<User['role'], 'GUARD' | 'ADMIN' | 'CLIENT'> = {
      admin: 'ADMIN',
      guard: 'GUARD',
      client: 'CLIENT',
    };

    const [firstName, ...rest] = editUser.name.trim().split(' ');
    const lastName = rest.join(' ');

    try {
      const response = await apiService.updateAdminUser(editingUserId, {
        firstName,
        lastName: lastName || firstName,
        email: editUser.email.trim().toLowerCase(),
        role: roleMap[editUser.role],
      });

      if (!response.success || !response.data) {
        Alert.alert('Error', response.message || 'Failed to update user');
        return;
      }

      const updatedRoleMap: Record<string, User['role']> = {
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
              role: updatedRoleMap[response.data.role] || editUser.role,
            }
          : u
      ));

      setShowEditModal(false);
      setEditingUserId(null);

      Alert.alert('Success', 'User updated successfully');
    } catch (error: any) {
      console.error('Edit user error:', error);
      Alert.alert('Error', error.message || 'Failed to update user');
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

  const renderUserItem = ({ item }: { item: User }) => (
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
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUserAction(item.id, 'edit')}
          activeOpacity={0.7}
        >
          <SettingsIcon size={16} color={COLORS.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        {item.status === 'active' ? (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleUserAction(item.id, 'suspend')}
            activeOpacity={0.7}
          >
            <EmergencyIcon size={16} color={COLORS.warning} />
            <Text style={[styles.actionText, { color: COLORS.warning }]}>Suspend</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleUserAction(item.id, 'activate')}
            activeOpacity={0.7}
          >
            <UserIcon size={16} color={COLORS.success} />
            <Text style={[styles.actionText, { color: COLORS.success }]}>Activate</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUserAction(item.id, 'delete')}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: COLORS.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="User Management"
        showLogo={false}
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
          { key: 'admin', label: 'Admins', icon: UserIcon },
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
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Sticky Action Button */}
      <TouchableOpacity 
        style={styles.stickyAddButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.stickyAddButtonText}>+ Add User</Text>
      </TouchableOpacity>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New User</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={newUser.name}
                onChangeText={(text) => setNewUser(prev => ({ ...prev, name: text }))}
                placeholder="Enter full name"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.fieldInput}
                value={newUser.email}
                onChangeText={(text) => setNewUser(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {['admin', 'guard', 'client'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      newUser.role === role && styles.roleOptionSelected,
                    ]}
                    onPress={() => setNewUser(prev => ({ ...prev, role: role as User['role'] }))}
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
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Department</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={newUser.department}
                  onChangeText={(text) => setNewUser(prev => ({ ...prev, department: text }))}
                  placeholder="Enter department"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateUser}
            >
              <Text style={styles.createButtonText}>Create User</Text>
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
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={editUser.name}
                onChangeText={(text) => setEditUser(prev => ({ ...prev, name: text }))}
                placeholder="Enter full name"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.fieldInput}
                value={editUser.email}
                onChangeText={(text) => setEditUser(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {['admin', 'guard', 'client'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      editUser.role === role && styles.roleOptionSelected,
                    ]}
                    onPress={() => setEditUser(prev => ({ ...prev, role: role as User['role'] }))}
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
              style={styles.createButton}
              onPress={handleSaveEditUser}
            >
              <Text style={styles.createButtonText}>Save Changes</Text>
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
    bottom: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.medium,
    zIndex: 1000,
  },
  stickyAddButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
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
    paddingBottom: SPACING.xl * 3,
  },
  userCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
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
    gap: SPACING.md,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
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
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  formField: {
    marginBottom: SPACING.lg,
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
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.small,
  },
  createButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default UserManagementScreen;
