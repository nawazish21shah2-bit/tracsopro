/**
 * Admin Navigator - Complete admin navigation system
 * Provides access to all admin screens and functionality
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/globalStyles';
import TabBarIcon from '../components/navigation/TabBarIcon';

// Import Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminOperationsCenter from '../screens/admin/AdminOperationsCenter';
import ShiftSchedulingScreen from '../screens/admin/ShiftSchedulingScreen';
import IncidentReviewScreen from '../screens/admin/IncidentReviewScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import InvitationManagementScreen from '../screens/admin/InvitationManagementScreen';
import SiteManagementScreen from '../screens/admin/SiteManagementScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminSubscriptionScreen from '../screens/admin/AdminSubscriptionScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import SupportContactScreen from '../screens/settings/SupportContactScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import SystemSettingsScreen from '../screens/superAdmin/SystemSettingsScreen';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import SupportHubScreen from '../screens/support/SupportHubScreen';
import SupportTicketDetailScreen from '../screens/support/SupportTicketDetailScreen';
import ShiftDetailsScreen from '../screens/shifts/ShiftDetailsScreen';
import EditShiftScreen from '../screens/shifts/EditShiftScreen';

export type AdminTabParamList = {
  Dashboard: undefined;
  Operations: undefined;
  Management: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  AdminOperationsCenter: undefined;
  ShiftScheduling: undefined;
  IncidentReview: undefined;
  UserManagement: undefined;
  InvitationManagement: undefined;
  SiteManagement: undefined;
  AdminAnalytics: undefined;
  AdminSettings: undefined;
  AdminSubscription: undefined;
  AdminNotificationSettings: undefined;
  AdminNotifications: undefined;
  AdminProfileEdit: undefined;
  AdminSupportContact: undefined;
  AdminChangePassword: undefined;
  AdminSystemSettings: undefined;
  IndividualChatScreen: {
    chatId: string;
    chatName: string;
    avatar?: string;
    context?: 'report' | 'site' | 'general' | 'support';
  };
  ChatListScreen: undefined;
  SupportHubScreen: { variant?: 'admin'; mode?: 'mine' | 'inbox' | 'platform' };
  SupportTicketDetailScreen: {
    ticketId: string;
    variant?: 'admin' | 'superAdmin' | 'client' | 'guard';
    mode?: 'mine' | 'inbox' | 'platform';
  };
  ShiftDetails: { shiftId: string; shift?: any };
  EditShift: { shiftId: string; shift?: any };
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createStackNavigator<AdminStackParamList>();

// Create a stack navigator for management screens
const ManagementStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UserManagement" component={UserManagementScreen} />
    <Stack.Screen name="InvitationManagement" component={InvitationManagementScreen} />
    <Stack.Screen name="SiteManagement" component={SiteManagementScreen} />
    <Stack.Screen name="ShiftScheduling" component={ShiftSchedulingScreen} />
  </Stack.Navigator>
);

// Create a stack navigator for reports screens
const ReportsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="IncidentReview" component={IncidentReviewScreen} />
    <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
  </Stack.Navigator>
);

// Wrapper components for settings screens with admin variant
const AdminNotificationSettingsWrapper: React.FC = () => (
  <NotificationSettingsScreen variant="admin" />
);

const AdminProfileEditWrapper: React.FC = () => (
  <ProfileEditScreen variant="admin" />
);

const AdminSupportContactWrapper: React.FC = () => (
  <SupportContactScreen variant="admin" />
);

const AdminChangePasswordWrapper: React.FC = () => (
  <ChangePasswordScreen variant="admin" />
);

const AdminSystemSettingsWrapper: React.FC = () => (
  <SystemSettingsScreen />
);

const AdminTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          switch (route.name) {
            case 'Dashboard':
              return <TabBarIcon name="home" focused={focused} />;
            case 'Operations':
              return <TabBarIcon name="activity" focused={focused} />;
            case 'Management':
              return <TabBarIcon name="user" focused={focused} />;
            case 'Reports':
              return <TabBarIcon name="fileText" focused={focused} />;
            case 'Settings':
              return <TabBarIcon name="settings" focused={focused} />;
            default:
              return <TabBarIcon name="home" focused={focused} />;
          }
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={[
            styles.tabLabel,
            { color: focused ? COLORS.primary : COLORS.textSecondary }
          ]}>
            {route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboard}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Operations" 
        component={AdminOperationsCenter}
        options={{
          tabBarLabel: 'Operations',
        }}
      />
      <Tab.Screen 
        name="Management" 
        component={ManagementStack}
        options={{
          tabBarLabel: 'Management',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsStack}
        options={{
          tabBarLabel: 'Reports',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={AdminSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Main Admin Stack Navigator
const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
      <Stack.Screen name="AdminOperationsCenter" component={AdminOperationsCenter} />
      <Stack.Screen name="ShiftScheduling" component={ShiftSchedulingScreen} />
      <Stack.Screen name="IncidentReview" component={IncidentReviewScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="InvitationManagement" component={InvitationManagementScreen} />
      <Stack.Screen name="SiteManagement" component={SiteManagementScreen} />
      <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      <Stack.Screen name="AdminSubscription" component={AdminSubscriptionScreen} />
      <Stack.Screen 
        name="AdminNotificationSettings" 
        component={AdminNotificationSettingsWrapper} 
      />
      <Stack.Screen 
        name="AdminNotifications" 
        component={() => <NotificationListScreen variant="admin" />} 
      />
      <Stack.Screen 
        name="AdminProfileEdit" 
        component={AdminProfileEditWrapper} 
      />
      <Stack.Screen 
        name="AdminSupportContact" 
        component={AdminSupportContactWrapper} 
      />
      <Stack.Screen 
        name="AdminChangePassword" 
        component={AdminChangePasswordWrapper} 
      />
      <Stack.Screen 
        name="AdminSystemSettings" 
        component={AdminSystemSettingsWrapper} 
      />
      <Stack.Screen 
        name="IndividualChatScreen" 
        component={IndividualChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ChatListScreen" 
        component={ChatListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SupportHubScreen"
        component={SupportHubScreen}
        initialParams={{ variant: 'admin', mode: 'inbox' }}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SupportTicketDetailScreen"
        component={SupportTicketDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ShiftDetails" component={ShiftDetailsScreen} />
      <Stack.Screen name="EditShift" component={EditShiftScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  tabBar: {
    backgroundColor: COLORS.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.sm,
    height: 70,
  },
});

export default AdminNavigator;
