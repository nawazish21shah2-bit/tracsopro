/**
 * Site Management Screen - Admin site management
 * Manage sites, geofencing, and guard assignments
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { LocationIcon, SettingsIcon } from '../../components/ui/AppIcons';
import apiService from '../../services/api';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

interface Site {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  clientName?: string;
}

const SiteManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [newSite, setNewSite] = useState({
    name: '',
    address: '',
    clientId: '',
  });
  const [editSite, setEditSite] = useState({
    name: '',
    address: '',
    clientId: '',
    isActive: true,
  });

  useEffect(() => {
    loadSites();
    loadClients();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminSites();
      if (!response.success || !response.data) {
        console.warn('Failed to load sites:', response.message);
        return;
      }

      const backendSites = response.data.sites as any[];
      const mapped: Site[] = backendSites.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        status: s.isActive ? 'active' : 'inactive',
        clientName: s.client?.user
          ? `${s.client.user.firstName} ${s.client.user.lastName}`.trim() || s.client.user.email
          : undefined,
      }));

      setSites(mapped);
    } catch (error: any) {
      console.error('Failed to load sites:', error);
      Alert.alert('Error', error.message || 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await apiService.getAdminClients();
      if (!response.success || !response.data) {
        console.warn('Failed to load clients:', response.message);
        return;
      }

      const backendClients = response.data.clients as any[];
      setClients(backendClients);
    } catch (error: any) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleCreateSite = async () => {
    if (!newSite.name || !newSite.address || !newSite.clientId) {
      Alert.alert('Error', 'Name, address, and client ID are required');
      return;
    }

    try {
      const response = await apiService.createAdminSite({
        clientId: newSite.clientId,
        name: newSite.name,
        address: newSite.address,
      });

      if (!response.success || !response.data) {
        Alert.alert('Error', response.message || 'Failed to create site');
        return;
      }

      const s = response.data;
      const site: Site = {
        id: s.id,
        name: s.name,
        address: s.address,
        status: s.isActive ? 'active' : 'inactive',
        clientName: s.client?.user
          ? `${s.client.user.firstName} ${s.client.user.lastName}`.trim() || s.client.user.email
          : undefined,
      };

      setSites(prev => [site, ...prev]);
      setShowCreateModal(false);
      setNewSite({ name: '', address: '', clientId: '' });
      Alert.alert('Success', 'Site created successfully');
    } catch (error: any) {
      console.error('Create site error:', error);
      Alert.alert('Error', error.message || 'Failed to create site');
    }
  };

  const openEditSite = (siteId: string) => {
    const s = sites.find(x => x.id === siteId);
    if (!s) return;

    setEditingSiteId(s.id);
    setEditSite({
      name: s.name,
      address: s.address,
      clientId: '',
      isActive: s.status === 'active',
    });
    setShowEditModal(true);
  };

  const handleSaveEditSite = async () => {
    if (!editingSiteId) return;

    if (!editSite.name || !editSite.address) {
      Alert.alert('Error', 'Name and address are required');
      return;
    }

    try {
      const payload: any = {
        name: editSite.name,
        address: editSite.address,
        isActive: editSite.isActive,
      };
      if (editSite.clientId) {
        payload.clientId = editSite.clientId;
      }

      const response = await apiService.updateAdminSite(editingSiteId, payload);
      if (!response.success || !response.data) {
        Alert.alert('Error', response.message || 'Failed to update site');
        return;
      }

      const s = response.data;
      setSites(prev => prev.map(site =>
        site.id === editingSiteId
          ? {
              ...site,
              name: s.name,
              address: s.address,
              status: s.isActive ? 'active' : 'inactive',
            }
          : site
      ));

      setShowEditModal(false);
      setEditingSiteId(null);
      Alert.alert('Success', 'Site updated successfully');
    } catch (error: any) {
      console.error('Update site error:', error);
      Alert.alert('Error', error.message || 'Failed to update site');
    }
  };

  const handleDeleteSite = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    Alert.alert(
      'Delete Site',
      `Are you sure you want to delete ${site.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteAdminSite(siteId);
              if (!response.success) {
                Alert.alert('Error', response.message || 'Failed to delete site');
                return;
              }
              setSites(prev => prev.filter(s => s.id !== siteId));
            } catch (error: any) {
              console.error('Delete site error:', error);
              Alert.alert('Error', error.message || 'Failed to delete site');
            }
          },
        },
      ],
    );
  };

  const renderSiteItem = ({ item }: { item: Site }) => (
    <View style={styles.siteCard}>
      <View style={styles.siteHeader}>
        <View style={styles.locationIconContainer}>
          <LocationIcon size={20} color={COLORS.primary} />
        </View>
        <View style={styles.siteInfo}>
          <View style={styles.siteNameRow}>
            <Text style={styles.siteName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? COLORS.success : COLORS.error }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.siteAddress}>{item.address}</Text>
          {item.clientName && (
            <Text style={styles.clientText}>Client: {item.clientName}</Text>
          )}
        </View>
      </View>
      <View style={styles.separator} />
      <View style={styles.siteActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => openEditSite(item.id)}>
          <View style={styles.actionIconContainer}>
            <SettingsIcon size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteSite(item.id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Site Management"
        onMenuPress={openDrawer}
        onNotificationPress={() => {
          // Handle notification press
        }}
        profileDrawer={
          <AdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToSiteManagement={() => {
              closeDrawer();
            }}
          />
        }
      />

      <View style={styles.contentWrapper}>
        <FlatList
          data={sites}
          renderItem={renderSiteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadSites}
        />
      </View>

      {/* Sticky Action Button */}
      <TouchableOpacity 
        style={styles.stickyAddButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.stickyAddButtonText}>+ Add Site</Text>
      </TouchableOpacity>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Site</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={newSite.name}
                onChangeText={(text) => setNewSite(prev => ({ ...prev, name: text }))}
                placeholder="Enter site name"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={styles.fieldInput}
                value={newSite.address}
                onChangeText={(text) => setNewSite(prev => ({ ...prev, address: text }))}
                placeholder="Enter site address"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Client</Text>
              <View style={styles.dropdownContainer}>
                {clients.map((c) => {
                  const label = `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || c.user.email;
                  const selected = newSite.clientId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                      onPress={() => setNewSite(prev => ({ ...prev, clientId: c.id }))}
                    >
                      <Text style={[styles.dropdownText, selected && styles.dropdownTextSelected]}>
                        {label} ({c.id})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateSite}
            >
              <Text style={styles.createButtonText}>Create Site</Text>
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
            <Text style={styles.modalTitle}>Edit Site</Text>
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                setEditingSiteId(null);
              }}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={editSite.name}
                onChangeText={(text) => setEditSite(prev => ({ ...prev, name: text }))}
                placeholder="Enter site name"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={styles.fieldInput}
                value={editSite.address}
                onChangeText={(text) => setEditSite(prev => ({ ...prev, address: text }))}
                placeholder="Enter site address"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Client (optional override)</Text>
              <View style={styles.dropdownContainer}>
                {clients.map((c) => {
                  const label = `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || c.user.email;
                  const selected = editSite.clientId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                      onPress={() => setEditSite(prev => ({ ...prev, clientId: c.id }))}
                    >
                      <Text style={[styles.dropdownText, selected && styles.dropdownTextSelected]}>
                        {label} ({c.id})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TouchableOpacity
                  style={[styles.roleOption, editSite.isActive && styles.roleOptionSelected]}
                  onPress={() => setEditSite(prev => ({ ...prev, isActive: true }))}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      editSite.isActive && styles.roleOptionTextSelected,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleOption, !editSite.isActive && styles.roleOptionSelected]}
                  onPress={() => setEditSite(prev => ({ ...prev, isActive: false }))}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      !editSite.isActive && styles.roleOptionTextSelected,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleSaveEditSite}
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
  container: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.primary, marginTop: 50, },
  backButton: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.md },
  headerTitle: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold },
  addButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md },
  addButtonText: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  contentWrapper: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  listContainer: { padding: SPACING.lg },
  siteCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
  },
  siteInfo: {
    flex: 1,
  },
  siteNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  siteName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  siteAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  clientText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderCard,
    marginVertical: SPACING.md,
  },
  siteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  deleteText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  stickyAddButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  stickyAddButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  modalContainer: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, backgroundColor: COLORS.backgroundSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.borderCard },
  modalTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary },
  closeButton: { fontSize: TYPOGRAPHY.fontSize.xl, color: COLORS.textSecondary },
  modalContent: { flex: 1, padding: SPACING.lg },
  formField: { marginBottom: SPACING.lg },
  fieldLabel: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  fieldInput: { backgroundColor: COLORS.backgroundSecondary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.borderCard },
  roleOption: { flex: 1, backgroundColor: COLORS.backgroundSecondary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderCard },
  roleOptionSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleOptionText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textPrimary },
  roleOptionTextSelected: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  dropdownContainer: { maxHeight: 200, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.backgroundSecondary, borderWidth: 1, borderColor: COLORS.borderCard, ...SHADOWS.small },
  dropdownItem: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderCard },
  dropdownItemSelected: { backgroundColor: COLORS.primaryLight },
  dropdownText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textPrimary },
  dropdownTextSelected: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  createButton: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.lg, ...SHADOWS.small },
  createButtonText: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.bold },
});

export default SiteManagementScreen;
