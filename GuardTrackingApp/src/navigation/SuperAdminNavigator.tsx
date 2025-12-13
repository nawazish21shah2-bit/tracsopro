/**
 * Super Admin Navigator - Complete super admin navigation system
 * Provides access to all super admin screens and platform management functionality
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { 
  HomeIcon, 
  UserIcon, 
  ReportsIcon, 
  SettingsIcon, 
  ShiftsIcon,
  LocationIcon,
  EmergencyIcon 
} from '../components/ui/AppIcons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/globalStyles';

// Import Super Admin Screens
import SuperAdminDashboard from '../screens/superAdmin/SuperAdminDashboard';
import CompanyManagementScreen from '../screens/superAdmin/CompanyManagementScreen';
import PlatformAnalyticsScreen from '../screens/superAdmin/PlatformAnalyticsScreen';
import BillingManagementScreen from '../screens/superAdmin/BillingManagementScreen';
import SystemSettingsScreen from '../screens/superAdmin/SystemSettingsScreen';
import AuditLogsScreen from '../screens/superAdmin/AuditLogsScreen';
import CompanyDetailsScreen from '../screens/superAdmin/CompanyDetailsScreen';
import CreateCompanyScreen from '../screens/superAdmin/CreateCompanyScreen';
import BuyPlanScreen from '../screens/superAdmin/BuyPlanScreen';
import PaymentDetailScreen from '../screens/superAdmin/PaymentDetailScreen';
import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import SupportContactScreen from '../screens/settings/SupportContactScreen';

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
  PlatformAnalytics: undefined;
  BillingManagement: undefined;
  PaymentDetail: { paymentId: string };
  SystemSettings: undefined;
  AuditLogs: undefined;
  BuyPlan: undefined;
  SuperAdminNotifications: undefined;
  SuperAdminProfileEdit: undefined;
  SuperAdminNotificationSettings: undefined;
  SuperAdminChangePassword: undefined;
  SuperAdminSupportContact: undefined;
};

const Tab = createBottomTabNavigator<SuperAdminTabParamList>();
const Stack = createStackNavigator<SuperAdminStackParamList>();

// Create a stack navigator for company management screens
const CompanyStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CompanyManagement" component={CompanyManagementScreen} />
    <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
    <Stack.Screen name="CreateCompany" component={CreateCompanyScreen} />
  </Stack.Navigator>
);

// Create a stack navigator for analytics screens
const AnalyticsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PlatformAnalytics" component={PlatformAnalyticsScreen} />
    <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
  </Stack.Navigator>
);

// Create a stack navigator for billing screens
const BillingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BillingManagement" component={BillingManagementScreen} />
    <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
  </Stack.Navigator>
);

const SuperAdminTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          
          switch (route.name) {
            case 'Dashboard':
              IconComponent = HomeIcon;
              break;
            case 'Companies':
              IconComponent = UserIcon;
              break;
            case 'Analytics':
              IconComponent = ReportsIcon;
              break;
            case 'Billing':
              IconComponent = ShiftsIcon;
              break;
            case 'Settings':
              IconComponent = SettingsIcon;
              break;
            default:
              IconComponent = HomeIcon;
          }
          
          return (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <IconComponent 
                size={20} 
                color={focused ? COLORS.primary : COLORS.textSecondary} 
              />
            </View>
          );
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
        component={SuperAdminDashboard}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Companies" 
        component={CompanyStack}
        options={{
          tabBarLabel: 'Companies',
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsStack}
        options={{
          tabBarLabel: 'Analytics',
        }}
      />
      <Tab.Screen 
        name="Billing" 
        component={BillingStack}
        options={{
          tabBarLabel: 'Billing',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SystemSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Main Super Admin Stack Navigator
const SuperAdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SuperAdminTabs" component={SuperAdminTabNavigator} />
      <Stack.Screen name="CompanyManagement" component={CompanyManagementScreen} />
      <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
      <Stack.Screen name="CreateCompany" component={CreateCompanyScreen} />
      <Stack.Screen name="PlatformAnalytics" component={PlatformAnalyticsScreen} />
      <Stack.Screen name="BillingManagement" component={BillingManagementScreen} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} />
      <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
      <Stack.Screen name="BuyPlan" component={BuyPlanScreen} />
      <Stack.Screen 
        name="SuperAdminNotifications" 
        component={() => <NotificationListScreen variant="superAdmin" />} 
      />
      <Stack.Screen 
        name="SuperAdminProfileEdit" 
        component={() => <ProfileEditScreen variant="admin" />} 
      />
      <Stack.Screen 
        name="SuperAdminNotificationSettings" 
        component={() => <NotificationSettingsScreen variant="admin" />} 
      />
      <Stack.Screen 
        name="SuperAdminChangePassword" 
        component={() => <ChangePasswordScreen variant="superAdmin" />} 
      />
      <Stack.Screen 
        name="SuperAdminSupportContact" 
        component={() => <SupportContactScreen variant="admin" />} 
      />
    </Stack.Navigator>
  );
};

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
