/**
 * Site Management Screen - Admin site management
 * Manage sites, geofencing, and guard assignments
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { LocationIcon, UserIcon, SettingsIcon } from '../../components/ui/AppIcons';

interface Site {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  assignedGuards: number;
  maxGuards: number;
}

const SiteManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [sites] = useState<Site[]>([
    { id: '1', name: 'Central Office', address: '123 Main St', status: 'active', assignedGuards: 2, maxGuards: 3 },
    { id: '2', name: 'Warehouse A', address: '456 Industrial Blvd', status: 'active', assignedGuards: 1, maxGuards: 2 },
  ]);

  const renderSiteItem = ({ item }: { item: Site }) => (
    <View style={styles.siteCard}>
      <View style={styles.siteHeader}>
        <LocationIcon size={24} color={COLORS.primary} />
        <View style={styles.siteInfo}>
          <Text style={styles.siteName}>{item.name}</Text>
          <Text style={styles.siteAddress}>{item.address}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? COLORS.success : COLORS.error }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.siteStats}>
        <Text style={styles.statText}>Guards: {item.assignedGuards}/{item.maxGuards}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Management</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Site</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sites}
        renderItem={renderSiteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.primary, marginTop: 50, },
  backButton: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.md },
  headerTitle: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold },
  addButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 8 },
  addButtonText: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  listContainer: { padding: SPACING.md },
  siteCard: { backgroundColor: COLORS.backgroundSecondary, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm },
  siteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  siteInfo: { flex: 1, marginLeft: SPACING.md },
  siteName: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.textPrimary },
  siteAddress: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 8 },
  statusText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textInverse },
  siteStats: { paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  statText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
});

export default SiteManagementScreen;
