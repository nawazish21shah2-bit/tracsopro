// Shift Summary Table Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

interface ShiftSummaryData {
  date: string;
  day: string;
  site: string;
  shiftTime: string;
  status: 'Completed' | 'Missed';
  checkIn?: string;
  checkOut?: string;
}

interface ShiftSummaryTableProps {
  data: ShiftSummaryData[];
  title?: string;
}

const ShiftSummaryTable: React.FC<ShiftSummaryTableProps> = ({ 
  data, 
  title = "This Week's Shifts Summary" 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return COLORS.success;
      case 'Missed':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.dateColumn]}>DATE</Text>
      <Text style={[styles.headerCell, styles.siteColumn]}>SITE</Text>
      <Text style={[styles.headerCell, styles.timeColumn]}>SHIFT TIME</Text>
      <Text style={[styles.headerCell, styles.statusColumn]}>STATUS</Text>
      <Text style={[styles.headerCell, styles.checkColumn]}>CHECK IN</Text>
      <Text style={[styles.headerCell, styles.checkColumn]}>CHECK OUT</Text>
    </View>
  );

  const renderRow = (item: ShiftSummaryData, index: number) => (
    <View key={index} style={styles.dataRow}>
      <View style={styles.dateColumn}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.dayText}>{item.day}</Text>
      </View>
      
      <View style={styles.siteColumn}>
        <Text style={styles.siteText}>{item.site}</Text>
      </View>
      
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{item.shiftTime}</Text>
      </View>
      
      <View style={styles.statusColumn}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.checkColumn}>
        <Text style={styles.checkText}>{item.checkIn || '--:--'}</Text>
      </View>
      
      <View style={styles.checkColumn}>
        <Text style={styles.checkText}>{item.checkOut || '--:--'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.tableContainer}>
        {renderHeader()}
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {data.map((item, index) => renderRow(item, index))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.lg,
    shadowColor: COLORS.cardShadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  tableContainer: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  headerCell: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    alignItems: 'center',
  },
  dateColumn: {
    flex: 1.2,
    alignItems: 'flex-start',
  },
  siteColumn: {
    flex: 1.5,
    alignItems: 'center',
  },
  timeColumn: {
    flex: 1.5,
    alignItems: 'center',
  },
  statusColumn: {
    flex: 1,
    alignItems: 'center',
  },
  checkColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  dayText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  siteText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '500' as const,
    color: COLORS.textInverse,
  },
  checkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 300, // Limit height for scrolling
  },
});

export default ShiftSummaryTable;
