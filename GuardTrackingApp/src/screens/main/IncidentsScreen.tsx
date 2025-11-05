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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 20,
  },
  incidentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  incidentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  incidentIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  incidentType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentTime: {
    fontSize: 12,
    color: '#999',
  },
  incidentLocation: {
    fontSize: 12,
    color: '#666',
  },
  evidenceContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  evidenceText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
});

export default IncidentsScreen;
