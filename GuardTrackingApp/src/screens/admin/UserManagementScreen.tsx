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
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { UserIcon, SettingsIcon, EmergencyIcon } from '../../components/ui/AppIcons';

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
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'guard' | 'client'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'guard' as User['role'],
    department: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    // Mock users data
    const mockUsers: User[] = [
      {
        id: 'user_1',
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'guard',
        status: 'active',
        department: 'Security',
        lastLogin: '2024-11-09 10:30',
        createdAt: '2024-10-01',
      },
      {
        id: 'user_2',
        name: 'Sarah Johnson',
        email: 'sarah.j@company.com',
        role: 'guard',
        status: 'active',
        department: 'Security',
        lastLogin: '2024-11-09 08:15',
        createdAt: '2024-09-15',
      },
      {
        id: 'user_3',
        name: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        role: 'admin',
        status: 'active',
        lastLogin: '2024-11-09 09:45',
        createdAt: '2024-08-20',
      },
      {
        id: 'user_4',
        name: 'ABC Corporation',
        email: 'contact@abccorp.com',
        role: 'client',
        status: 'active',
        lastLogin: '2024-11-08 16:20',
        createdAt: '2024-07-10',
      },
    ];

    setUsers(mockUsers);
  };

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const user: User = {
      id: `user_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
      department: newUser.department || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers(prev => [...prev, user]);
    setShowCreateModal(false);
    setNewUser({ name: '', email: '', role: 'guard', department: '' });
    
    Alert.alert('Success', 'User created successfully');
  };

  const handleUserAction = (userId: string, action: 'edit' | 'suspend' | 'activate' | 'delete') => {
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
              onPress: () => {
                setUsers(prev => prev.map(u => 
                  u.id === userId ? { ...u, status: 'suspended' } : u
                ));
              }
            },
          ]
        );
        break;
      case 'activate':
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, status: 'active' } : u
        ));
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
              onPress: () => {
                setUsers(prev => prev.filter(u => u.id !== userId));
              }
            },
          ]
        );
        break;
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
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      {item.department && (
        <Text style={styles.userDepartment}>Department: {item.department}</Text>
      )}
      
      <View style={styles.userMeta}>
        <Text style={styles.metaText}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.lastLogin && (
          <Text style={styles.metaText}>
            Last login: {new Date(item.lastLogin).toLocaleString()}
          </Text>
        )}
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUserAction(item.id, 'edit')}
        >
          <SettingsIcon size={16} color={COLORS.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        {item.status === 'active' ? (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleUserAction(item.id, 'suspend')}
          >
            <EmergencyIcon size={16} color={COLORS.warning} />
            <Text style={styles.actionText}>Suspend</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleUserAction(item.id, 'activate')}
          >
            <UserIcon size={16} color={COLORS.success} />
            <Text style={styles.actionText}>Activate</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUserAction(item.id, 'delete')}
        >
          <Text style={[styles.actionText, { color: COLORS.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {['all', 'admin', 'guard', 'client'].map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterButton,
              selectedRole === role && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedRole(role as any)}
          >
            <Text style={[
              styles.filterText,
              selectedRole === role && styles.filterTextActive,
            ]}>
              {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

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
    </View>
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
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundPrimary,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  listContainer: {
    padding: SPACING.md,
  },
  userCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
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
    gap: SPACING.xs,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  userDepartment: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
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
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
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
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  roleOption: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  roleOptionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  roleOptionTextSelected: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  createButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  createButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default UserManagementScreen;
