import { createTabResetListener } from '../utils/tabNavigationHelpers';

// Dashboard Navigator
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import TabBarIcon from '../components/navigation/TabBarIcon';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/globalStyles';
import GuardHomeScreen from '../screens/dashboard/GuardHomeScreen';
import MyShiftsScreen from '../screens/dashboard/MyShiftsScreen';
import ReportsScreen from '../screens/dashboard/ReportsScreen';
import CheckInScreen from '../screens/dashboard/CheckInScreen';
import GuardSettingsScreen from '../screens/guard/GuardSettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import SupportContactScreen from '../screens/settings/SupportContactScreen';
import SupportHubScreen from '../screens/support/SupportHubScreen';
import SupportTicketDetailScreen from '../screens/support/SupportTicketDetailScreen';
import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import { createStackNavigator } from '@react-navigation/stack';

export type DashboardTabParamList = {
  Home: undefined;
  'Check In/Out': undefined;
  'My Shifts': undefined;
  Reports: undefined;
  Settings: undefined;
  Chat: undefined;
  Jobs: undefined;
};

export type SettingsStackParamList = {
  GuardSettings: undefined;
  GuardNotificationSettings: undefined;
  GuardProfileEdit: undefined;
  GuardChangePassword: undefined;
  GuardSupportContact: undefined;
  SupportHubScreen: { variant?: 'guard'; mode?: 'mine' | 'inbox' | 'platform' };
  SupportTicketDetailScreen: {
    ticketId: string;
    variant?: 'guard';
    mode?: 'mine' | 'inbox' | 'platform';
  };
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();
type ChatStackParamList = {
  ChatList: undefined;
  Chat: { roomId: string; roomName?: string };
};
const ChatStack = createStackNavigator<ChatStackParamList>();

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
        name="SupportHubScreen"
        component={SupportHubScreen}
        initialParams={{ variant: 'guard', mode: 'mine' }}
      />
      <SettingsStack.Screen
        name="SupportTicketDetailScreen"
        component={SupportTicketDetailScreen}
      />
      <SettingsStack.Screen
        name="Notifications"
        component={() => <NotificationListScreen variant="guard" />}
      />
    </SettingsStack.Navigator>
  );
};

// Chat stack: list view + chat room
const ChatStackNavigator: React.FC = () => {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen name="Chat" component={ChatScreen} />
    </ChatStack.Navigator>
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
          fontSize: 10,
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
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
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
          tabBarIcon: ({ focused }) => <TabBarIcon name="mapPin" focused={focused} />,
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
          tabBarIcon: ({ focused }) => <TabBarIcon name="calendar" focused={focused} />,
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
          tabBarIcon: ({ focused }) => <TabBarIcon name="fileText" focused={focused} />,
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
        name="Chat"
        component={ChatStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="messageCircle" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Chat
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="settings" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textSecondary }]}>
              Settings
            </Text>
          ),
        }}
        listeners={createTabResetListener({
          tabName: 'Settings',
          rootScreen: 'GuardSettings',
        })}
      />
      {/* REMOVED: Jobs tab - Job board system removed (Option B) */}
      {/* Guards now see assigned shifts in "My Shifts" tab */}
    </Tab.Navigator>
  );
};

export default DashboardNavigator;

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: 2,
    textAlign: 'center',
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
});

