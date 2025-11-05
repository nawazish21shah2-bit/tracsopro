// Main App Navigator (After Authentication)
import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UserRole } from '../types';

// Import dashboard screens
import GuardHomeScreen from '../screens/dashboard/GuardHomeScreen';
import MyShiftsScreen from '../screens/dashboard/MyShiftsScreen';
import ReportsScreen from '../screens/dashboard/ReportsScreen';
import JobsScreen from '../screens/dashboard/JobsScreen';
import ProfileScreen from '../screens/dashboard/ProfileScreen';
import DashboardNavigator from './DashboardNavigator';
import { Home, Clock, Calendar, FileText, Briefcase, User } from 'react-native-feather';

// Import other screens (create placeholders for now)
import TrackingScreen from '../screens/main/TrackingScreen';
import IncidentsScreen from '../screens/main/IncidentsScreen';
import MessagesScreen from '../screens/main/MessagesScreen';


// Import client screens
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import ClientStackNavigator from './ClientStackNavigator';
import GuardStackNavigator from './GuardStackNavigator';

// Import stack screens
import IncidentDetailScreen from '../screens/main/IncidentDetailScreen';
import CreateIncidentScreen from '../screens/main/CreateIncidentScreen';
import AddIncidentReportScreen from '../screens/dashboard/AddIncidentReportScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Navigation types
export type MainTabParamList = {
  Dashboard: undefined;
  Tracking: undefined;
  Reports: undefined;
  Jobs: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  IncidentDetail: { incidentId: string };
  CreateIncident: undefined;
  AddIncidentReport: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

// Tab Navigator Component
const MainTabNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Show different navigation based on user role
  const userRole = user?.role as any;
  const isClient = userRole === UserRole.CLIENT || userRole === 'CLIENT';

  // Debug logging for troubleshooting
  if (__DEV__) {
    console.log('MainTabNavigator - User Role:', userRole);
    console.log('MainTabNavigator - Is Client:', isClient);
  }

  // If client, use dedicated client navigator
  if (isClient) {
    return <ClientStackNavigator />;
  }

  // Otherwise use guard navigation
  return <GuardStackNavigator />;
};

// Tab Icon Component using react-native-feather icons
const TabIcon: React.FC<{ name: string; color: string; size: number }> = ({ name, color, size }) => {
  const iconSize = 20; // enforce 20x20 for consistency
  switch (name) {
    case 'home':
      return <Home width={iconSize} height={iconSize} stroke={color} />;
    case 'location':
      return <Clock width={iconSize} height={iconSize} stroke={color} />;
    case 'calendar':
      return <Calendar width={iconSize} height={iconSize} stroke={color} />;
    case 'reports':
      return <FileText width={iconSize} height={iconSize} stroke={color} />;
    case 'jobs':
      return <Briefcase width={iconSize} height={iconSize} stroke={color} />;
    case 'person':
      return <User width={iconSize} height={iconSize} stroke={color} />;
    default:
      return <Home width={iconSize} height={iconSize} stroke={color} />;
  }
};

// Main Stack Navigator
const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IncidentDetail"
        component={IncidentDetailScreen}
        options={{
          title: 'Incident Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="CreateIncident"
        component={CreateIncidentScreen}
        options={{
          title: 'Report Incident',
          headerBackTitle: 'Cancel',
        }}
      />
      <Stack.Screen
        name="AddIncidentReport"
        component={AddIncidentReportScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
