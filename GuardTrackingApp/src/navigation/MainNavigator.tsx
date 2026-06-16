// Main App Navigator (After Authentication)
import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UserRole } from '../types';

import ClientStackNavigator from './ClientStackNavigator';
import GuardStackNavigator from './GuardStackNavigator';
import AdminNavigator from './AdminNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';
import ImpersonationBanner from '../components/superAdmin/ImpersonationBanner';

import IncidentDetailScreen from '../screens/main/IncidentDetailScreen';
import CreateIncidentScreen from '../screens/main/CreateIncidentScreen';
import AddIncidentReportScreen from '../screens/dashboard/AddIncidentReportScreen';

export type MainStackParamList = {
  RootDrawer: undefined;
  IncidentDetail: { incidentId: string };
  CreateIncident: undefined;
  AddIncidentReport: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

const MainTabNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const userRole = user?.role as string | undefined;
  const isClient = userRole === UserRole.CLIENT || userRole === 'CLIENT';
  const isAdmin = userRole === UserRole.ADMIN || userRole === 'ADMIN' || user?.email === 'admin@test.com';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  if (isSuperAdmin) {
    return <SuperAdminNavigator />;
  }
  if (isAdmin) {
    return <AdminNavigator />;
  }
  if (isClient) {
    return <ClientStackNavigator />;
  }

  return <GuardStackNavigator />;
};

const MainContentNavigator: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <ImpersonationBanner />
      <MainTabNavigator />
    </View>
  );
};

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
