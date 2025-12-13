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
import { HomeIcon, LocationIcon, ShiftsIcon, ReportsIcon, JobsIcon, UserIcon } from '../components/ui/AppIcons';

// Import other screens (create placeholders for now)
import TrackingScreen from '../screens/main/TrackingScreen';
import IncidentsScreen from '../screens/main/IncidentsScreen';
import MessagesScreen from '../screens/main/MessagesScreen';


// Import client screens
import ClientStackNavigator from './ClientStackNavigator';
import GuardStackNavigator from './GuardStackNavigator';

// Import admin screens
import AdminNavigator from './AdminNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';

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
  RootDrawer: undefined;
  Settings: undefined;
  IncidentDetail: { incidentId: string };
  CreateIncident: undefined;
  AddIncidentReport: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

// Tab Navigator Component
const MainTabNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Show different navigation based on user role
  const userRole = user?.role as any;
  const isClient = userRole === UserRole.CLIENT || userRole === 'CLIENT';
  const isAdmin = userRole === UserRole.ADMIN || userRole === 'ADMIN' || user?.email === 'admin@test.com';
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || user?.email === 'superadmin@tracsopro.com';

  // Debug logging for troubleshooting
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('MainTabNavigator - User Role:', userRole);
    console.log('MainTabNavigator - Is Client:', isClient);
    console.log('MainTabNavigator - Is Admin:', isAdmin);
    console.log('MainTabNavigator - Is Super Admin:', isSuperAdmin);
  }

  // Route based on user role
  if (isSuperAdmin) {
    return <SuperAdminNavigator />;
  } else if (isAdmin) {
    return <AdminNavigator />;
  } else if (isClient) {
    return <ClientStackNavigator />;
  }

  // Otherwise use guard navigation
  return <GuardStackNavigator />;
};

// Tab Icon Component using AppIcons
const TabIcon: React.FC<{ name: string; color: string; size: number }> = ({ name, color, size }) => {
  const iconSize = 20; // enforce 20x20 for consistency
  switch (name) {
    case 'home':
      return <HomeIcon size={iconSize} color={color} />;
    case 'location':
      return <LocationIcon size={iconSize} color={color} />;
    case 'calendar':
      return <ShiftsIcon size={iconSize} color={color} />;
    case 'reports':
      return <ReportsIcon size={iconSize} color={color} />;
    case 'jobs':
      return <JobsIcon size={iconSize} color={color} />;
    case 'person':
      return <UserIcon size={iconSize} color={color} />;
    default:
      return <HomeIcon size={iconSize} color={color} />;
  }
};

// Main content navigator (replaced drawer with direct tabs)
// Settings can be accessed via a menu button in the header later
const MainContentNavigator: React.FC = () => {
  return <MainTabNavigator />;
};

// Main Stack Navigator
const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="RootDrawer"
        component={MainContentNavigator}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
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
    </Stack.Navigator>
  );
};

export default MainNavigator;
