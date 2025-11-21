/**
 * Admin Navigator - Complete admin navigation system
 * Provides access to all admin screens and functionality
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

// Import Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminOperationsCenter from '../screens/admin/AdminOperationsCenter';
import ShiftSchedulingScreen from '../screens/admin/ShiftSchedulingScreen';
import IncidentReviewScreen from '../screens/admin/IncidentReviewScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import SiteManagementScreen from '../screens/admin/SiteManagementScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminSubscriptionScreen from '../screens/admin/AdminSubscriptionScreen';

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
  SiteManagement: undefined;
  AdminAnalytics: undefined;
  AdminSettings: undefined;
  AdminSubscription: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createStackNavigator<AdminStackParamList>();

// Create a stack navigator for management screens
const ManagementStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UserManagement" component={UserManagementScreen} />
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

const AdminTabNavigator: React.FC = () => {
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
            case 'Operations':
              IconComponent = EmergencyIcon;
              break;
            case 'Management':
              IconComponent = UserIcon;
              break;
            case 'Reports':
              IconComponent = ReportsIcon;
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
      <Stack.Screen name="SiteManagement" component={SiteManagementScreen} />
      <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      <Stack.Screen name="AdminSubscription" component={AdminSubscriptionScreen} />
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

export default AdminNavigator;
