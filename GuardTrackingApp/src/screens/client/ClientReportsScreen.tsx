// Reports Screen for Supervisors
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { fetchIncidents } from '../../store/slices/incidentSlice';
import { fetchGuards } from '../../store/slices/guardSlice';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

type ReportsScreenNavigationProp = StackNavigationProp<any, 'Reports'>;

const { width } = Dimensions.get('window');

const ReportsScreen: React.FC = () => {
  const navigation = useNavigation<ReportsScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { incidents, isLoading: incidentsLoading } = useSelector((state: RootState) => state.incidents);
  const { guards, isLoading: guardsLoading } = useSelector((state: RootState) => state.guards);

  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [selectedReportType, setSelectedReportType] = useState<'incidents' | 'performance' | 'shifts' | 'analytics'>('incidents');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [selectedTimeRange]);

  const loadReportData = async () => {
    try {
      await Promise.all([
        dispatch(fetchIncidents({ page: 1, limit: 100 })),
        dispatch(fetchGuards({ page: 1, limit: 100 })),
      ]);
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  const getTimeRangeDates = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedTimeRange) {
      case 'today':
        return { start: today, end: now };
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: weekAgo, end: now };
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start: monthAgo, end: now };
      case 'year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        return { start: yearAgo, end: now };
      default:
        return { start: today, end: now };
    }
  };

  const getFilteredData = () => {
    const { start, end } = getTimeRangeDates();
    
    const filteredIncidents = incidents.filter(incident => {
      const incidentDate = new Date(incident.reportedAt);
      return incidentDate >= start && incidentDate <= end;
    });

    return { incidents: filteredIncidents, guards };
  };

  const generateIncidentReport = () => {
    const { incidents: filteredIncidents } = getFilteredData();
    
    const reportData = {
      timeRange: selectedTimeRange,
      totalIncidents: filteredIncidents.length,
      byType: getIncidentsByType(filteredIncidents),
      bySeverity: getIncidentsBySeverity(filteredIncidents),
      byStatus: getIncidentsByStatus(filteredIncidents),
      trends: getIncidentTrends(filteredIncidents),
    };

    Alert.alert(
      'Incident Report Generated',
      `Report for ${selectedTimeRange}:\n\n` +
      `Total Incidents: ${reportData.totalIncidents}\n` +
      `Critical: ${reportData.bySeverity.critical}\n` +
      `High: ${reportData.bySeverity.high}\n` +
      `Medium: ${reportData.bySeverity.medium}\n` +
      `Low: ${reportData.bySeverity.low}`,
      [
        { text: 'OK' },
        { text: 'Export', onPress: () => exportReport('incidents', reportData) }
      ]
    );
  };

  const generatePerformanceReport = () => {
    const { guards } = getFilteredData();
    
    const reportData = {
      timeRange: selectedTimeRange,
      totalGuards: guards.length,
      activeGuards: guards.filter(g => g.status === 'active').length,
      averageRating: calculateAverageRating(guards),
      topPerformers: getTopPerformers(guards),
      performanceDistribution: getPerformanceDistribution(guards),
    };

    Alert.alert(
      'Performance Report Generated',
      `Report for ${selectedTimeRange}:\n\n` +
      `Total Guards: ${reportData.totalGuards}\n` +
      `Active Guards: ${reportData.activeGuards}\n` +
      `Average Rating: ${reportData.averageRating.toFixed(1)}/5.0\n` +
      `Top Performers: ${reportData.topPerformers.length}`,
      [
        { text: 'OK' },
        { text: 'Export', onPress: () => exportReport('performance', reportData) }
      ]
    );
  };

  const generateShiftReport = () => {
    // Simplified shift report - in real app, you'd have shift data
    const reportData = {
      timeRange: selectedTimeRange,
      totalShifts: 150, // Mock data
      completedShifts: 142,
      onTimeArrivals: 135,
      lateArrivals: 7,
      noShows: 8,
    };

    Alert.alert(
      'Shift Report Generated',
      `Report for ${selectedTimeRange}:\n\n` +
      `Total Shifts: ${reportData.totalShifts}\n` +
      `Completed: ${reportData.completedShifts}\n` +
      `On Time: ${reportData.onTimeArrivals}\n` +
      `Late: ${reportData.lateArrivals}\n` +
      `No Shows: ${reportData.noShows}`,
      [
        { text: 'OK' },
        { text: 'Export', onPress: () => exportReport('shifts', reportData) }
      ]
    );
  };

  const generateAnalyticsReport = () => {
    const { incidents: filteredIncidents, guards } = getFilteredData();
    
    const reportData = {
      timeRange: selectedTimeRange,
      incidentAnalytics: getIncidentAnalytics(filteredIncidents),
      guardAnalytics: getGuardAnalytics(guards),
      efficiencyMetrics: getEfficiencyMetrics(filteredIncidents, guards),
    };

    Alert.alert(
      'Analytics Report Generated',
      `Report for ${selectedTimeRange}:\n\n` +
      `Incident Response Time: ${reportData.incidentAnalytics.avgResponseTime}\n` +
      `Guard Efficiency: ${reportData.efficiencyMetrics.guardEfficiency}%\n` +
      `System Uptime: ${reportData.efficiencyMetrics.systemUptime}%`,
      [
        { text: 'OK' },
        { text: 'Export', onPress: () => exportReport('analytics', reportData) }
      ]
    );
  };

  const exportReport = (type: string, data: any) => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      Alert.alert('Export Complete', `${type} report has been exported successfully.`);
    }, 2000);
  };

  // Helper functions for report generation
  const getIncidentsByType = (incidents: any[]) => {
    const types: { [key: string]: number } = {};
    incidents.forEach(incident => {
      types[incident.type] = (types[incident.type] || 0) + 1;
    });
    return types;
  };

  const getIncidentsBySeverity = (incidents: any[]) => {
    return {
      critical: incidents.filter(i => i.severity === 'critical').length,
      high: incidents.filter(i => i.severity === 'high').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      low: incidents.filter(i => i.severity === 'low').length,
    };
  };

  const getIncidentsByStatus = (incidents: any[]) => {
    return {
      reported: incidents.filter(i => i.status === 'reported').length,
      investigating: incidents.filter(i => i.status === 'investigating').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      closed: incidents.filter(i => i.status === 'closed').length,
    };
  };

  const getIncidentTrends = (incidents: any[]) => {
    // Simplified trend analysis
    return {
      increasing: incidents.length > 10,
      trend: incidents.length > 10 ? 'up' : 'down',
      percentage: Math.abs(Math.random() * 20),
    };
  };

  const calculateAverageRating = (guards: any[]) => {
    if (guards.length === 0) return 0;
    const totalRating = guards.reduce((sum, guard) => sum + guard.performance.averageRating, 0);
    return totalRating / guards.length;
  };

  const getTopPerformers = (guards: any[]) => {
    return guards
      .filter(guard => guard.status === 'active')
      .sort((a, b) => b.performance.averageRating - a.performance.averageRating)
      .slice(0, 5);
  };

  const getPerformanceDistribution = (guards: any[]) => {
    return {
      excellent: guards.filter(g => g.performance.averageRating >= 4.5).length,
      good: guards.filter(g => g.performance.averageRating >= 3.5 && g.performance.averageRating < 4.5).length,
      average: guards.filter(g => g.performance.averageRating >= 2.5 && g.performance.averageRating < 3.5).length,
      poor: guards.filter(g => g.performance.averageRating < 2.5).length,
    };
  };

  const getIncidentAnalytics = (incidents: any[]) => {
    return {
      avgResponseTime: '8.5 min',
      resolutionRate: '92%',
      escalationRate: '15%',
    };
  };

  const getGuardAnalytics = (guards: any[]) => {
    return {
      totalGuards: guards.length,
      activeGuards: guards.filter(g => g.status === 'active').length,
      avgPerformance: calculateAverageRating(guards),
    };
  };

  const getEfficiencyMetrics = (incidents: any[], guards: any[]) => {
    return {
      guardEfficiency: 87,
      systemUptime: 99.5,
      responseTime: '8.5 min',
    };
  };

  const { incidents: filteredIncidents } = getFilteredData();

  if (incidentsLoading || guardsLoading) {
    return <LoadingSpinner text="Loading reports..." />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
        <Text style={styles.subtitle}>Generate comprehensive reports</Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <Text style={styles.sectionTitle}>Time Range</Text>
        <View style={styles.timeRangeButtons}>
          {(['today', 'week', 'month', 'year'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range && styles.timeRangeButtonActive
              ]}
              onPress={() => setSelectedTimeRange(range)}
            >
              <Text style={[
                styles.timeRangeButtonText,
                selectedTimeRange === range && styles.timeRangeButtonTextActive
              ]}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Report Type Selector */}
      <View style={styles.reportTypeContainer}>
        <Text style={styles.sectionTitle}>Report Type</Text>
        <View style={styles.reportTypeGrid}>
          {([
            { type: 'incidents', title: 'Incident Report', icon: '🚨', description: 'Incident analysis and trends' },
            { type: 'performance', title: 'Performance Report', icon: '📊', description: 'Guard performance metrics' },
            { type: 'shifts', title: 'Shift Report', icon: '⏰', description: 'Shift completion and attendance' },
            { type: 'analytics', title: 'Analytics Report', icon: '📈', description: 'System analytics and insights' },
          ] as const).map((report) => (
            <TouchableOpacity
              key={report.type}
              style={[
                styles.reportTypeCard,
                selectedReportType === report.type && styles.reportTypeCardActive
              ]}
              onPress={() => setSelectedReportType(report.type)}
            >
              <Text style={styles.reportTypeIcon}>{report.icon}</Text>
              <Text style={[
                styles.reportTypeTitle,
                selectedReportType === report.type && styles.reportTypeTitleActive
              ]}>
                {report.title}
              </Text>
              <Text style={styles.reportTypeDescription}>{report.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card title="Quick Statistics" variant="elevated" style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{filteredIncidents.length}</Text>
              <Text style={styles.statLabel}>Total Incidents</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{guards.length}</Text>
              <Text style={styles.statLabel}>Total Guards</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {guards.filter(g => g.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Active Guards</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {filteredIncidents.filter(i => i.status === 'resolved').length}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Generate Report */}
      <View style={styles.generateContainer}>
        <Card title="Generate Report" variant="elevated" style={styles.generateCard}>
          <Text style={styles.generateDescription}>
            Generate a comprehensive {selectedReportType} report for {selectedTimeRange}
          </Text>
          
          <Button
            title={isGenerating ? "Generating..." : "Generate Report"}
            onPress={() => {
              switch (selectedReportType) {
                case 'incidents':
                  generateIncidentReport();
                  break;
                case 'performance':
                  generatePerformanceReport();
                  break;
                case 'shifts':
                  generateShiftReport();
                  break;
                case 'analytics':
                  generateAnalyticsReport();
                  break;
              }
            }}
            disabled={isGenerating}
            style={styles.generateButton}
          />
        </Card>
      </View>

      {/* Report History */}
      <View style={styles.historyContainer}>
        <Card title="Recent Reports" variant="elevated" style={styles.historyCard}>
          <View style={styles.historyItem}>
            <Text style={styles.historyTitle}>Weekly Incident Report</Text>
            <Text style={styles.historyDate}>Generated 2 hours ago</Text>
          </View>
          <View style={styles.historyItem}>
            <Text style={styles.historyTitle}>Monthly Performance Report</Text>
            <Text style={styles.historyDate}>Generated 1 day ago</Text>
          </View>
          <View style={styles.historyItem}>
            <Text style={styles.historyTitle}>Quarterly Analytics Report</Text>
            <Text style={styles.historyDate}>Generated 1 week ago</Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  timeRangeContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  timeRangeButtonTextActive: {
    color: '#ffffff',
  },
  reportTypeContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  reportTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reportTypeCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  reportTypeCardActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  reportTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  reportTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  reportTypeTitleActive: {
    color: '#007AFF',
  },
  reportTypeDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    padding: 20,
  },
  statsCard: {
    marginBottom: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  generateContainer: {
    padding: 20,
  },
  generateCard: {
    marginBottom: 0,
  },
  generateDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  generateButton: {
    marginTop: 8,
  },
  historyContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  historyCard: {
    marginBottom: 0,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
});

export default ReportsScreen;
