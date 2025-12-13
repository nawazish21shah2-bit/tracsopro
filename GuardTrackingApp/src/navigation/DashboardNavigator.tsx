
// Dashboard Navigator
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import GuardHomeScreen from '../screens/dashboard/GuardHomeScreen';
import MyShiftsScreen from '../screens/dashboard/MyShiftsScreen';
import ReportsScreen from '../screens/dashboard/ReportsScreen';
// REMOVED: AvailableShiftsScreen - Job board system removed (Option B)
import ChatListScreen from '../screens/chat/ChatListScreen';
import CheckInScreen from '../screens/dashboard/CheckInScreen';
import { HomeIcon, ShiftsIcon, ReportsIcon, CheckInIcon } from '../components/ui/AppIcons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/globalStyles';

export type DashboardTabParamList = {
  Home: undefined;
  Chat: undefined;
  'My Shifts': undefined;
  'Check In/Out': undefined;
  Reports: undefined;
  Jobs: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();

const DashboardNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.backgroundPrimary,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderLight,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.sm,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.fontSize.xs,
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          marginTop: SPACING.xs,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={GuardHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <HomeIcon size={20} color={focused ? COLORS.primary : COLORS.textSecondary} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Home
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <ReportsIcon size={20} color={focused ? COLORS.primary : COLORS.textSecondary} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Chat
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="My Shifts"
        component={MyShiftsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <ShiftsIcon size={20} color={focused ? COLORS.primary : COLORS.textSecondary} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              My Shifts
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Check In/Out"
        component={CheckInScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <CheckInIcon size={20} color={focused ? COLORS.primary : COLORS.textSecondary} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Check In/Out
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <ReportsIcon size={20} color={focused ? COLORS.primary : COLORS.textSecondary} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Reports
            </Text>
          ),
        }}
      />
      {/* REMOVED: Jobs tab - Job board system removed (Option B) */}
      {/* Guards now see assigned shifts in "My Shifts" tab */}
    </Tab.Navigator>
  );
};

export default DashboardNavigator;

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundSecondary,
  },
  tabIconWrapperActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

