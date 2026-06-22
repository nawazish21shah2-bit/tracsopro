import { createTabResetListener } from '../utils/tabNavigationHelpers';

/**
 * Super Admin Navigator - Complete super admin navigation system
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import TabBarIcon from '../components/navigation/TabBarIcon';
import ImpersonationBanner from '../components/superAdmin/ImpersonationBanner';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/globalStyles';

import SuperAdminDashboard from '../screens/superAdmin/SuperAdminDashboard';
import CompanyManagementScreen from '../screens/superAdmin/CompanyManagementScreen';
import PlatformAnalyticsScreen from '../screens/superAdmin/PlatformAnalyticsScreen';
import BillingManagementScreen from '../screens/superAdmin/BillingManagementScreen';
import SystemSettingsScreen from '../screens/superAdmin/SystemSettingsScreen';
import AuditLogsScreen from '../screens/superAdmin/AuditLogsScreen';
import CompanyDetailsScreen from '../screens/superAdmin/CompanyDetailsScreen';
import CreateCompanyScreen from '../screens/superAdmin/CreateCompanyScreen';
import EditCompanyScreen from '../screens/superAdmin/EditCompanyScreen';
import BuyPlanScreen from '../screens/superAdmin/BuyPlanScreen';
import PaymentDetailScreen from '../screens/superAdmin/PaymentDetailScreen';
import ImpersonateUserScreen from '../screens/superAdmin/ImpersonateUserScreen';
import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import SupportHubScreen from '../screens/support/SupportHubScreen';
import SupportTicketDetailScreen from '../screens/support/SupportTicketDetailScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';

export type SuperAdminTabParamList = {
  Dashboard: undefined;
  Companies: undefined;
  Analytics: undefined;
  Billing: undefined;
  Settings: undefined;
};

export type SuperAdminStackParamList = {
  SuperAdminTabs: undefined;
  CompanyManagement: undefined;
  CompanyDetails: { companyId: string };
  CreateCompany: undefined;
  EditCompany: { companyId: string };
  PlatformAnalytics: undefined;
  BillingManagement: undefined;
  PaymentDetail: { paymentId: string };
  SystemSettings: undefined;
  AuditLogs: undefined;
  BuyPlan: { companyId: string };
  ImpersonateUser: undefined;
  SuperAdminNotifications: undefined;
  SuperAdminProfileEdit: undefined;
  SuperAdminNotificationSettings: undefined;
  SuperAdminChangePassword: undefined;
  ChatListScreen: undefined;
  SupportHubScreen: { variant?: 'superAdmin'; mode?: 'mine' | 'inbox' | 'platform' };
  SupportTicketDetailScreen: {
    ticketId: string;
    variant?: 'superAdmin';
    mode?: 'mine' | 'inbox' | 'platform';
  };
  IndividualChatScreen: {
    chatId: string;
    chatName: string;
    avatar?: string;
    context?: 'report' | 'site' | 'general' | 'support';
  };
};

const Tab = createBottomTabNavigator<SuperAdminTabParamList>();
const Stack = createStackNavigator<SuperAdminStackParamList>();

const CompanyStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CompanyManagement" component={CompanyManagementScreen} />
    <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
    <Stack.Screen name="CreateCompany" component={CreateCompanyScreen} />
    <Stack.Screen name="EditCompany" component={EditCompanyScreen} />
  </Stack.Navigator>
);

const AnalyticsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PlatformAnalytics" component={PlatformAnalyticsScreen} />
    <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
  </Stack.Navigator>
);

const BillingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BillingManagement" component={BillingManagementScreen} />
    <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
  </Stack.Navigator>
);

const SuperAdminSettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} />
    <Stack.Screen
      name="SuperAdminNotificationSettings"
      component={() => <NotificationSettingsScreen variant="superAdmin" />}
    />
    <Stack.Screen
      name="SuperAdminProfileEdit"
      component={() => <ProfileEditScreen variant="superAdmin" />}
    />
    <Stack.Screen
      name="SuperAdminChangePassword"
      component={() => <ChangePasswordScreen variant="superAdmin" />}
    />
    <Stack.Screen
      name="SupportHubScreen"
      component={SupportHubScreen}
      initialParams={{ variant: 'superAdmin', mode: 'platform' }}
    />
    <Stack.Screen name="SupportTicketDetailScreen" component={SupportTicketDetailScreen} />
  </Stack.Navigator>
);

const SuperAdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={shellStyles.root}>
    <ImpersonationBanner />
    {children}
  </View>
);

const SuperAdminTabNavigator: React.FC = () => (
  <SuperAdminShell>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          switch (route.name) {
            case 'Dashboard':
              return <TabBarIcon name="home" focused={focused} />;
            case 'Companies':
              return <TabBarIcon name="briefcase" focused={focused} />;
            case 'Analytics':
              return <TabBarIcon name="barChart" focused={focused} />;
            case 'Billing':
              return <TabBarIcon name="fileText" focused={focused} />;
            case 'Settings':
              return <TabBarIcon name="settings" focused={focused} />;
            default:
              return <TabBarIcon name="home" focused={focused} />;
          }
        },
        tabBarLabel: ({ focused }) => (
          <Text
            style={[
              styles.tabLabel,
              { color: focused ? COLORS.primary : COLORS.textSecondary },
            ]}
          >
            {route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
      })}
    >
      <Tab.Screen name="Dashboard" component={SuperAdminDashboard} />
      <Tab.Screen name="Companies" component={CompanyStack} listeners={createTabResetListener({ tabName: 'Companies', rootScreen: 'CompanyManagement' })} />
      <Tab.Screen name="Analytics" component={AnalyticsStack} listeners={createTabResetListener({ tabName: 'Analytics', rootScreen: 'PlatformAnalytics' })} />
      <Tab.Screen name="Billing" component={BillingStack} listeners={createTabResetListener({ tabName: 'Billing', rootScreen: 'BillingManagement' })} />
      <Tab.Screen
        name="Settings"
        component={SuperAdminSettingsStack}
        listeners={createTabResetListener({ tabName: 'Settings', rootScreen: 'SystemSettings' })}
      />
    </Tab.Navigator>
  </SuperAdminShell>
);

const SuperAdminNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SuperAdminTabs" component={SuperAdminTabNavigator} />
    <Stack.Screen name="CompanyManagement" component={CompanyManagementScreen} />
    <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
    <Stack.Screen name="CreateCompany" component={CreateCompanyScreen} />
    <Stack.Screen name="EditCompany" component={EditCompanyScreen} />
    <Stack.Screen name="PlatformAnalytics" component={PlatformAnalyticsScreen} />
    <Stack.Screen name="BillingManagement" component={BillingManagementScreen} />
    <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
    <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} />
    <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
    <Stack.Screen name="BuyPlan" component={BuyPlanScreen} />
    <Stack.Screen name="ImpersonateUser" component={ImpersonateUserScreen} />
    <Stack.Screen
      name="SuperAdminNotifications"
      component={() => <NotificationListScreen variant="superAdmin" />}
    />
    <Stack.Screen
      name="SuperAdminProfileEdit"
      component={() => <ProfileEditScreen variant="superAdmin" />}
    />
    <Stack.Screen
      name="SuperAdminNotificationSettings"
      component={() => <NotificationSettingsScreen variant="superAdmin" />}
    />
    <Stack.Screen
      name="SuperAdminChangePassword"
      component={() => <ChangePasswordScreen variant="superAdmin" />}
    />
    <Stack.Screen name="ChatListScreen" component={ChatListScreen} />
    <Stack.Screen
      name="SupportHubScreen"
      component={SupportHubScreen}
      initialParams={{ variant: 'superAdmin', mode: 'platform' }}
    />
    <Stack.Screen name="SupportTicketDetailScreen" component={SupportTicketDetailScreen} />
    <Stack.Screen name="IndividualChatScreen" component={IndividualChatScreen} />
  </Stack.Navigator>
);

const shellStyles = StyleSheet.create({
  root: { flex: 1 },
});

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

export default SuperAdminNavigator;
