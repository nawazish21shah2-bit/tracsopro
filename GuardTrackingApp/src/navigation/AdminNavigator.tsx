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
            <View style={styles.tabIconContainer}>
              <IconComponent 
                size={size} 
                color={focused ? COLORS.primary : '#666666'} 
              />
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={[
            styles.tabLabel,
            { color: focused ? COLORS.primary : '#666666' }
          ]}>
            {route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#666666',
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
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: 2,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 8,
    paddingTop: 8,
    height: 65,
  },
});

export default AdminNavigator;
