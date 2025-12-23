
// Dashboard Navigator
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, StyleSheet } from 'react-native';
import GuardHomeScreen from '../screens/dashboard/GuardHomeScreen';
import MyShiftsScreen from '../screens/dashboard/MyShiftsScreen';
import ReportsScreen from '../screens/dashboard/ReportsScreen';
// REMOVED: AvailableShiftsScreen - Job board system removed (Option B)
// REMOVED: ChatListScreen - Chat tab removed from bottom navigation
import CheckInScreen from '../screens/dashboard/CheckInScreen';
import GuardSettingsScreen from '../screens/guard/GuardSettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import SupportContactScreen from '../screens/settings/SupportContactScreen';
import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import { HomeIcon, ShiftsIcon, ReportsIcon, CheckInIcon, SettingsIcon } from '../components/ui/AppIcons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/globalStyles';

export type DashboardTabParamList = {
  Home: undefined;
  'Check In/Out': undefined;
  'My Shifts': undefined;
  Reports: undefined;
  Settings: undefined;
  Jobs: undefined;
};

export type SettingsStackParamList = {
  GuardSettings: undefined;
  GuardNotificationSettings: undefined;
  GuardProfileEdit: undefined;
  GuardChangePassword: undefined;
  GuardSupportContact: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

// Settings Stack Navigator
const SettingsStackNavigator: React.FC = () => {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="GuardSettings" component={GuardSettingsScreen} />
      <SettingsStack.Screen 
        name="GuardNotificationSettings" 
        component={() => <NotificationSettingsScreen variant="guard" />} 
      />
      <SettingsStack.Screen 
        name="GuardProfileEdit" 
        component={() => <ProfileEditScreen variant="guard" />} 
      />
      <SettingsStack.Screen 
        name="GuardChangePassword" 
        component={() => <ChangePasswordScreen variant="guard" />} 
      />
      <SettingsStack.Screen 
        name="GuardSupportContact" 
        component={() => <SupportContactScreen variant="guard" />} 
      />
      <SettingsStack.Screen 
        name="Notifications" 
        component={() => <NotificationListScreen variant="guard" />} 
      />
    </SettingsStack.Navigator>
  );
};

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
        tabBarItemStyle: {
          flexShrink: 0,
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
            <Text 
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Home
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
            <Text 
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Check In/Out
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
            <Text 
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              My Shifts
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
            <Text 
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Reports
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <SettingsIcon size={20} color={focused ? COLORS.primary : COLORS.textSecondary} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text 
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Settings
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
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
});

