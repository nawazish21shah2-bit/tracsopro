// Bottom Tab Bar Component
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { Home, Clock, Calendar, FileText, Briefcase } from 'react-native-feather';

interface TabItem {
  id: 'home' | 'checkin' | 'shifts' | 'reports' | 'jobs';
  label: string;
  route: string;
}

interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (route: string) => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabPress }) => {
  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      route: 'GuardHome',
    },
    {
      id: 'checkin',
      label: 'Check In',
      route: 'CheckIn',
    },
    {
      id: 'shifts',
      label: 'My Shifts',
      route: 'MyShifts',
    },
    {
      id: 'reports',
      label: 'Reports',
      route: 'Reports',
    },
    {
      id: 'jobs',
      label: 'Jobs',
      route: 'Jobs',
    },
  ];

  const renderIcon = (id: TabItem['id'], active: boolean) => {
    const color = active ? COLORS.primary : COLORS.textSecondary;
    const size = 20;
    switch (id) {
      case 'home':
        return <Home width={size} height={size} stroke={color} />;
      case 'checkin':
        return <Clock width={size} height={size} stroke={color} />;
      case 'shifts':
        return <Calendar width={size} height={size} stroke={color} />;
      case 'reports':
        return <FileText width={size} height={size} stroke={color} />;
      case 'jobs':
        return <Briefcase width={size} height={size} stroke={color} />;
      default:
        return null;
    }
  };

  const renderTab = (tab: TabItem) => {
    const isActive = activeTab === tab.route;
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tab}
        onPress={() => onTabPress(tab.route)}
        activeOpacity={0.7}
      >
        <View style={[styles.tabContent, isActive && styles.activeTabContent]}>
          <View style={styles.iconWrapper}>
            {renderIcon(tab.id, isActive)}
          </View>
          <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
            {tab.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabBar}>
          {tabs.map(renderTab)}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.backgroundPrimary,
  },
  container: {
    backgroundColor: COLORS.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.medium,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    minHeight: 60,
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  activeTabContent: {
    backgroundColor: COLORS.primaryLight,
  },
  iconWrapper: {
    marginBottom: SPACING.xs,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default BottomTabBar;
