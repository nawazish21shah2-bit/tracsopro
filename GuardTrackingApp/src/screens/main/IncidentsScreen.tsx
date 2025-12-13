// Incidents Management Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { fetchIncidents, filterIncidentsByType, filterIncidentsBySeverity, filterIncidentsByStatus } from '../../store/slices/incidentSlice';
import { Incident, IncidentType, SeverityLevel, IncidentStatus } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

type IncidentsScreenNavigationProp = StackNavigationProp<any, 'Incidents'>;

const IncidentsScreen: React.FC = () => {
  const navigation = useNavigation<IncidentsScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { incidents, isLoading } = useSelector((state: RootState) => state.incidents);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'type' | 'severity' | 'status'>('all');
  const [filterValue, setFilterValue] = useState<string>('all');

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      await dispatch(fetchIncidents({ page: 1, limit: 20 }));
    } catch (error) {
      console.error('Error loading incidents:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIncidents();
    setRefreshing(false);
  };

  const handleFilterChange = (filterType: 'all' | 'type' | 'severity' | 'status', value: string) => {
    setSelectedFilter(filterType);
    setFilterValue(value);

    switch (filterType) {
      case 'type':
        dispatch(filterIncidentsByType(value as IncidentType));
        break;
      case 'severity':
        dispatch(filterIncidentsBySeverity(value as SeverityLevel));
        break;
      case 'status':
        dispatch(filterIncidentsByStatus(value as IncidentStatus));
        break;
      default:
        // Reset filters
        dispatch(fetchIncidents({ page: 1, limit: 20 }));
        break;
    }
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFBB33';
      case 'low': return '#00C851';
      default: return '#6C757D';
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'reported': return '#FF8800';
      case 'investigating': return '#007AFF';
      case 'resolved': return '#00C851';
      case 'closed': return '#6C757D';
      default: return '#6C757D';
    }
  };

  const getTypeIcon = (type: IncidentType) => {
    switch (type) {
      case 'security_breach': return '🚨';
      case 'medical_emergency': return '🏥';
      case 'fire_alarm': return '🔥';
      case 'vandalism': return '💥';
      case 'theft': return '💰';
      case 'trespassing': return '🚫';
      case 'equipment_failure': return '⚙️';
      default: return '📋';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    if (searchQuery) {
      return incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
             incident.type.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const renderIncidentItem = ({ item }: { item: Incident }) => (
    <TouchableOpacity
      style={styles.incidentCard}
      onPress={() => navigation.navigate('IncidentDetail', { incidentId: item.id })}
    >
      <View style={styles.incidentHeader}>
        <View style={styles.incidentTypeContainer}>
          <Text style={styles.incidentIcon}>{getTypeIcon(item.type)}</Text>
          <Text style={styles.incidentType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
            <Text style={styles.badgeText}>{item.severity.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.incidentDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.incidentFooter}>
        <Text style={styles.incidentTime}>
          {new Date(item.reportedAt).toLocaleString()}
        </Text>
        <Text style={styles.incidentLocation}>
          📍 {item.location.name}
        </Text>
      </View>

      {item.evidence && item.evidence.length > 0 && (
        <View style={styles.evidenceContainer}>
          <Text style={styles.evidenceText}>
            📎 {item.evidence.length} evidence file{item.evidence.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterButton = (title: string, value: string, isActive: boolean) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => handleFilterChange(selectedFilter, value)}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Incidents</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateIncident')}
        >
          <Text style={styles.addButtonText}>+ Report</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search incidents..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {renderFilterButton('All', 'all', selectedFilter === 'all' && filterValue === 'all')}
            {renderFilterButton('Critical', 'critical', selectedFilter === 'severity' && filterValue === 'critical')}
            {renderFilterButton('High', 'high', selectedFilter === 'severity' && filterValue === 'high')}
            {renderFilterButton('Medium', 'medium', selectedFilter === 'severity' && filterValue === 'medium')}
            {renderFilterButton('Low', 'low', selectedFilter === 'severity' && filterValue === 'low')}
            {renderFilterButton('Reported', 'reported', selectedFilter === 'status' && filterValue === 'reported')}
            {renderFilterButton('Investigating', 'investigating', selectedFilter === 'status' && filterValue === 'investigating')}
            {renderFilterButton('Resolved', 'resolved', selectedFilter === 'status' && filterValue === 'resolved')}
          </View>
        </ScrollView>
      </View>

      {/* Incidents List */}
      <FlatList
        data={filteredIncidents}
        renderItem={renderIncidentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No incidents found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'Start by reporting an incident'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  addButton: {
    backgroundColor: COLORS.backgroundPrimary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.small,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
  },
  searchInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterContainer: {
    backgroundColor: COLORS.backgroundPrimary,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  filterButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.textInverse,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  incidentCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  incidentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  incidentIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  incidentType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  incidentDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  incidentTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  incidentLocation: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  evidenceContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  evidenceText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});

export default IncidentsScreen;
