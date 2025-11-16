/**
 * Admin Analytics Screen - Performance analytics and reporting
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { ReportsIcon, SettingsIcon } from '../../components/ui/AppIcons';

const AdminAnalyticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics & Reports</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <ReportsIcon size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>156</Text>
            <Text style={styles.metricLabel}>Total Reports</Text>
          </View>
          
          <View style={styles.metricCard}>
            <SettingsIcon size={24} color={COLORS.success} />
            <Text style={styles.metricValue}>94.2%</Text>
            <Text style={styles.metricLabel}>Efficiency</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <Text style={styles.sectionText}>
            Comprehensive analytics dashboard with performance metrics, 
            guard efficiency tracking, and detailed reporting capabilities.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.primary },
  backButton: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.md, marginRight: SPACING.md },
  headerTitle: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold },
  content: { flex: 1, padding: SPACING.md },
  metricsGrid: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  metricCard: { flex: 1, backgroundColor: COLORS.backgroundSecondary, borderRadius: 12, padding: SPACING.md, alignItems: 'center' },
  metricValue: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary, marginVertical: SPACING.sm },
  metricLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  section: { backgroundColor: COLORS.backgroundSecondary, borderRadius: 12, padding: SPACING.md },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  sectionText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, lineHeight: 20 },
});

export default AdminAnalyticsScreen;
