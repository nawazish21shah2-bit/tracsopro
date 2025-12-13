/**
 * Invitation Management Screen - Admin invitation management
 * Create and manage invitations for guards and clients
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
  Clipboard,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { UserIcon, UsersIcon, SettingsIcon, EmergencyIcon, PlusIcon, CopyIcon, TrashIcon } from '../../components/ui/AppIcons';
import { Copy, Trash2, X } from 'react-native-feather';
import apiService from '../../services/api';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { RefreshControl } from 'react-native';

interface Invitation {
  id: string;
  invitationCode: string;
  email: string | null;
  role: 'GUARD' | 'CLIENT';
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  securityCompany?: {
    id: string;
    name: string;
  };
}

const InvitationManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [selectedRole, setSelectedRole] = useState<'all' | 'GUARD' | 'CLIENT'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role: 'GUARD' as 'GUARD' | 'CLIENT',
    expiresInDays: '7',
    maxUses: '1',
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [selectedFilter, selectedRole]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      
      if (selectedRole !== 'all') {
        filters.role = selectedRole;
      }
      
      if (selectedFilter === 'active') {
        filters.isActive = true;
        filters.isUsed = false;
      } else if (selectedFilter === 'used') {
        filters.isUsed = true;
      } else if (selectedFilter === 'expired') {
        filters.isActive = false;
      }

      const response = await apiService.getInvitations(filters);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load invitations');
      }

      const backendInvitations = Array.isArray(response.data) ? response.data : [];
      
      // Filter expired invitations on client side if needed
      let filteredInvitations = backendInvitations;
      if (selectedFilter === 'expired') {
        const now = new Date();
        filteredInvitations = backendInvitations.filter((inv: Invitation) => {
          return new Date(inv.expiresAt) < now || !inv.isActive;
        });
      } else if (selectedFilter === 'active') {
        const now = new Date();
        filteredInvitations = backendInvitations.filter((inv: Invitation) => {
          return new Date(inv.expiresAt) >= now && inv.isActive && inv.currentUses < inv.maxUses;
        });
      }

      setInvitations(filteredInvitations);
    } catch (error: any) {
      console.error('Failed to load invitations:', error);
      const errorMessage = error.message || 'Failed to load invitations';
      setError(errorMessage);
      if (!refreshing) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvitations();
  };

  const handleCreateInvitation = async () => {
    if (creatingInvitation) {
      return;
    }

    if (!newInvitation.role) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    const expiresInDays = parseInt(newInvitation.expiresInDays) || 7;
    const maxUses = parseInt(newInvitation.maxUses) || 1;

    if (expiresInDays < 1 || expiresInDays > 365) {
      Alert.alert('Error', 'Expiration days must be between 1 and 365');
      return;
    }

    if (maxUses < 1 || maxUses > 100) {
      Alert.alert('Error', 'Max uses must be between 1 and 100');
      return;
    }

    setCreatingInvitation(true);
    try {
      const response = await apiService.createInvitation({
        email: newInvitation.email.trim() || undefined,
        role: newInvitation.role,
        expiresInDays,
        maxUses,
      });

      if (!response.success || !response.data) {
        Alert.alert('Error', response.message || 'Failed to create invitation');
        return;
      }

      const createdInvitation = response.data;
      
      // Add to list
      setInvitations(prev => [createdInvitation, ...prev]);
      
      // Reset form
      setNewInvitation({
        email: '',
        role: 'GUARD',
        expiresInDays: '7',
        maxUses: '1',
      });
      setShowCreateModal(false);

      // Show success with code
      Alert.alert(
        'Invitation Created',
        `Invitation code: ${createdInvitation.invitationCode}\n\nShare this code with the ${newInvitation.role.toLowerCase()}.`,
        [
          {
            text: 'Copy Code',
            onPress: () => {
              Clipboard.setString(createdInvitation.invitationCode);
              setCopiedCode(createdInvitation.invitationCode);
              setTimeout(() => setCopiedCode(null), 2000);
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error: any) {
      console.error('Create invitation error:', error);
      const errorMessage = error.message || error.response?.data?.error || 'Failed to create invitation';
      
      // Check if error is about free tier limit
      if (errorMessage.includes('maximum limit') || errorMessage.includes('subscription plan') || errorMessage.includes('upgrade')) {
        Alert.alert(
          'Free Tier Limit Reached',
          errorMessage + '\n\nWould you like to upgrade your plan?',
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Upgrade', 
              onPress: () => {
                navigation.navigate('AdminSubscription' as never);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setCreatingInvitation(false);
    }
  };

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    Alert.alert('Copied!', 'Invitation code copied to clipboard');
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (actionLoading === invitationId) {
      return;
    }

    Alert.alert(
      'Revoke Invitation',
      'Are you sure you want to revoke this invitation? It will no longer be usable.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(invitationId);
            try {
              const response = await apiService.revokeInvitation(invitationId);
              if (!response.success) {
                Alert.alert('Error', response.message || 'Failed to revoke invitation');
                return;
              }
              setInvitations(prev => prev.map(inv =>
                inv.id === invitationId ? { ...inv, isActive: false } : inv
              ));
            } catch (error: any) {
              console.error('Revoke invitation error:', error);
              Alert.alert('Error', error.message || 'Failed to revoke invitation');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (actionLoading === invitationId) {
      return;
    }

    Alert.alert(
      'Delete Invitation',
      'Are you sure you want to delete this invitation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(invitationId);
            try {
              const response = await apiService.deleteInvitation(invitationId);
              if (!response.success) {
                Alert.alert('Error', response.message || 'Failed to delete invitation');
                return;
              }
              setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
            } catch (error: any) {
              console.error('Delete invitation error:', error);
              Alert.alert('Error', error.message || 'Failed to delete invitation');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (invitation: Invitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    
    if (!invitation.isActive) {
      return COLORS.error;
    }
    
    if (invitation.currentUses >= invitation.maxUses) {
      return COLORS.warning;
    }
    
    if (expiresAt < now) {
      return COLORS.error;
    }
    
    if (invitation.usedAt) {
      return COLORS.success;
    }
    
    return COLORS.primary;
  };

  const getStatusText = (invitation: Invitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    
    if (!invitation.isActive) {
      return 'REVOKED';
    }
    
    if (invitation.currentUses >= invitation.maxUses) {
      return 'FULLY USED';
    }
    
    if (expiresAt < now) {
      return 'EXPIRED';
    }
    
    if (invitation.usedAt) {
      return 'USED';
    }
    
    return 'ACTIVE';
  };

  const getRoleColor = (role: 'GUARD' | 'CLIENT') => {
    return role === 'GUARD' ? COLORS.primary : COLORS.success;
  };

  const filteredInvitations = invitations;

  const renderInvitationItem = ({ item }: { item: Invitation }) => {
    const isExpired = new Date(item.expiresAt) < new Date();
    const isFullyUsed = item.currentUses >= item.maxUses;
    const isActive = item.isActive && !isExpired && !isFullyUsed;
    const statusColor = getStatusColor(item);
    const statusText = getStatusText(item);

    return (
      <View style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <View style={styles.invitationInfo}>
            <View style={styles.codeContainer}>
              <Text style={styles.invitationCode}>{item.invitationCode}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopyCode(item.invitationCode)}
                activeOpacity={0.7}
              >
                <Copy width={14} height={14} stroke={COLORS.primary} />
                <Text style={styles.copyButtonText}>
                  {copiedCode === item.invitationCode ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
            {item.email && (
              <Text style={styles.invitationEmail}>For: {item.email}</Text>
            )}
          </View>
          
          <View style={styles.invitationBadges}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {item.role}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.invitationMeta}>
          <Text style={styles.metaText}>
            Expires: {new Date(item.expiresAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <Text style={styles.metaText}>
            Uses: {item.currentUses} / {item.maxUses}
          </Text>
          {item.usedAt && (
            <Text style={styles.metaText}>
              Used: {new Date(item.usedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          )}
        </View>
        
        <View style={styles.invitationActions}>
          {isActive && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleRevokeInvitation(item.id)}
              activeOpacity={0.7}
              disabled={actionLoading === item.id}
            >
              <EmergencyIcon size={16} color={actionLoading === item.id ? COLORS.textSecondary : COLORS.warning} />
              <Text style={[
                styles.actionText, 
                { color: actionLoading === item.id ? COLORS.textSecondary : COLORS.warning }
              ]}>
                {actionLoading === item.id ? 'Loading...' : 'Revoke'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteInvitation(item.id)}
            activeOpacity={0.7}
            disabled={actionLoading === item.id}
          >
            <Trash2 
              width={16} 
              height={16} 
              stroke={actionLoading === item.id ? COLORS.textSecondary : COLORS.error} 
            />
            <Text style={[
              styles.actionText, 
              { color: actionLoading === item.id ? COLORS.textSecondary : COLORS.error }
            ]}>
              {actionLoading === item.id ? 'Loading...' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Invitation Management"
        showLogo={false}
        onMenuPress={openDrawer}
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
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'used', label: 'Used' },
          { key: 'expired', label: 'Expired' },
        ].map((filter) => {
          const isActive = selectedFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Text style={[
                styles.filterText,
                isActive && styles.filterTextActive,
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.roleFilterContainer}>
        {[
          { key: 'all', label: 'All Roles' },
          { key: 'GUARD', label: 'Guards' },
          { key: 'CLIENT', label: 'Clients' },
        ].map((role) => {
          const isActive = selectedRole === role.key;
          return (
            <TouchableOpacity
              key={role.key}
              style={[
                styles.roleFilterButton,
                isActive && styles.roleFilterButtonActive,
              ]}
              onPress={() => setSelectedRole(role.key as any)}
            >
              <Text style={[
                styles.roleFilterText,
                isActive && styles.roleFilterTextActive,
              ]}>
                {role.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.contentWrapper}>
        {loading && !invitations.length ? (
          <LoadingOverlay visible={true} message="Loading invitations..." />
        ) : error && !invitations.length ? (
          <View style={styles.errorContainer}>
            {error.toLowerCase().includes('network') || error.toLowerCase().includes('timeout') || error.toLowerCase().includes('connection') ? (
              <NetworkError onRetry={loadInvitations} />
            ) : (
              <ErrorState error={error} onRetry={loadInvitations} />
            )}
          </View>
        ) : (
          <FlatList
            data={filteredInvitations}
            renderItem={renderInvitationItem}
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
                <Text style={styles.emptyText}>No invitations found</Text>
                <Text style={styles.emptySubtext}>Create an invitation to get started</Text>
              </View>
            }
          />
        )}
      </View>
      
      {loading && invitations.length > 0 && <LoadingOverlay visible={true} message="Refreshing..." />}

      {/* Sticky Action Button */}
      <TouchableOpacity 
        style={[styles.stickyAddButton, creatingInvitation && styles.stickyAddButtonDisabled]}
        onPress={() => setShowCreateModal(true)}
        disabled={creatingInvitation}
        activeOpacity={creatingInvitation ? 1 : 0.7}
      >
        <PlusIcon size={20} color={COLORS.textInverse} />
        <Text style={styles.stickyAddButtonText}>Create Invitation</Text>
      </TouchableOpacity>

      {/* Create Invitation Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Invitation</Text>
            <TouchableOpacity 
              onPress={() => setShowCreateModal(false)}
              disabled={creatingInvitation}
              activeOpacity={creatingInvitation ? 1 : 0.7}
              style={styles.closeButtonContainer}
            >
              <X width={24} height={24} stroke={creatingInvitation ? COLORS.textTertiary : COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Role *</Text>
              <Text style={styles.fieldHint}>
                {newInvitation.role === 'GUARD' 
                  ? 'Free tier: Up to 2 guards. Creating this invitation will check your current guard limit.'
                  : 'Free tier: Up to 1 client. Creating this invitation will check your current client limit.'}
              </Text>
              <View style={styles.roleSelector}>
                {['GUARD', 'CLIENT'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      newInvitation.role === role && styles.roleOptionSelected,
                      creatingInvitation && styles.roleOptionDisabled,
                    ]}
                    onPress={() => setNewInvitation(prev => ({ ...prev, role: role as 'GUARD' | 'CLIENT' }))}
                    disabled={creatingInvitation}
                    activeOpacity={creatingInvitation ? 1 : 0.7}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      newInvitation.role === role && styles.roleOptionTextSelected,
                    ]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email (Optional)</Text>
              <Text style={styles.fieldHint}>Leave empty for open invitation, or specify email for specific user</Text>
              <TextInput
                style={styles.fieldInput}
                value={newInvitation.email}
                onChangeText={(text) => setNewInvitation(prev => ({ ...prev, email: text }))}
                placeholder="user@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!creatingInvitation}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Expires In (Days) *</Text>
              <TextInput
                style={styles.fieldInput}
                value={newInvitation.expiresInDays}
                onChangeText={(text) => setNewInvitation(prev => ({ ...prev, expiresInDays: text }))}
                placeholder="7"
                keyboardType="numeric"
                editable={!creatingInvitation}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Max Uses *</Text>
              <Text style={styles.fieldHint}>Number of times this invitation can be used (1 = single use)</Text>
              <TextInput
                style={styles.fieldInput}
                value={newInvitation.maxUses}
                onChangeText={(text) => setNewInvitation(prev => ({ ...prev, maxUses: text }))}
                placeholder="1"
                keyboardType="numeric"
                editable={!creatingInvitation}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, creatingInvitation && styles.createButtonDisabled]}
              onPress={handleCreateInvitation}
              disabled={creatingInvitation}
              activeOpacity={creatingInvitation ? 1 : 0.7}
            >
              <Text style={styles.createButtonText}>
                {creatingInvitation ? 'Creating Invitation...' : 'Create Invitation'}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  roleFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
    gap: SPACING.xs,
  },
  roleFilterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  roleFilterButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  roleFilterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  roleFilterTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  contentWrapper: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: 100, // Space for sticky button
  },
  emptyContainer: {
    padding: SPACING.xxxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  invitationCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  invitationInfo: {
    flex: 1,
    minWidth: 0, // Allow flex shrinking
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  invitationCode: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  copyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  invitationEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  invitationBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    maxWidth: 120, // Limit width to force wrapping after 2 badges
    flexShrink: 0,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  invitationMeta: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  stickyAddButton: {
    position: 'absolute',
    bottom: 80, // Above bottom navigator
    right: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    ...SHADOWS.medium,
  },
  stickyAddButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  stickyAddButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  closeButtonContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
  },
  formField: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  fieldHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  fieldInput: {
    fontSize: TYPOGRAPHY.fontSize.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  roleOption: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  roleOptionDisabled: {
    opacity: 0.5,
  },
  roleOptionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  roleOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.small,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
});

export default InvitationManagementScreen;

