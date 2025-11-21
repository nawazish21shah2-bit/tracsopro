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
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/globalStyles';

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
  SystemSettings: undefined;
  AuditLogs: undefined;
  BuyPlan: undefined;
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
                color={focused ? COLORS.primary : '#7A7A7A'} 
              />
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={[
            styles.tabLabel,
            { color: focused ? COLORS.primary : '#7A7A7A' }
          ]}>
            {route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#7A7A7A',
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
        component={BillingManagementScreen}
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
      <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} />
      <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
      <Stack.Screen name="BuyPlan" component={BuyPlanScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabIconWrapperActive: {
    backgroundColor: 'rgba(28,108,169,0.2)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0F0FA',
    paddingBottom: 8,
    paddingTop: 8,
    height: 70,
  },
});

export default SuperAdminNavigator;
