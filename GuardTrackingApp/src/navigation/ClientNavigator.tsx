
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, StyleSheet } from 'react-native';
import TabBarIcon from '../components/navigation/TabBarIcon';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/globalStyles';

// Import Client Screens
import ClientDashboard from '../screens/client/ClientDashboard';
import ClientSites from '../screens/client/ClientSites';
import ClientReports from '../screens/client/ClientReports';
import ClientGuards from '../screens/client/ClientGuards';
import ClientSettings from '../screens/client/ClientSettings';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import SupportContactScreen from '../screens/settings/SupportContactScreen';
import SupportHubScreen from '../screens/support/SupportHubScreen';
import SupportTicketDetailScreen from '../screens/support/SupportTicketDetailScreen';
import CompanyDetailsScreen from '../screens/settings/CompanyDetailsScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';

export type ClientTabParamList = {
  Dashboard: undefined;
  'Sites & Shifts': undefined;
  Reports: undefined;
  Guards: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<ClientTabParamList>();
const SettingsStack = createStackNavigator();

const ClientSettingsStackNavigator: React.FC = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="ClientSettingsHome" component={ClientSettings} />
    <SettingsStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <SettingsStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    <SettingsStack.Screen name="SupportContact" component={SupportContactScreen} />
    <SettingsStack.Screen
      name="SupportHubScreen"
      component={SupportHubScreen}
      initialParams={{ variant: 'client', mode: 'mine' }}
    />
    <SettingsStack.Screen name="SupportTicketDetailScreen" component={SupportTicketDetailScreen} />
    <SettingsStack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
    <SettingsStack.Screen
      name="ClientChangePassword"
      component={() => <ChangePasswordScreen variant="client" />}
    />
  </SettingsStack.Navigator>
);

const ClientNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          switch (route.name) {
            case 'Dashboard':
              return <TabBarIcon name="home" focused={focused} />;
            case 'Sites & Shifts':
              return <TabBarIcon name="calendar" focused={focused} />;
            case 'Reports':
              return <TabBarIcon name="fileText" focused={focused} />;
            case 'Guards':
              return <TabBarIcon name="user" focused={focused} />;
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
      <Tab.Screen
        name="Dashboard"
        component={ClientDashboard}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Sites & Shifts"
        component={ClientSites}
        options={{
          tabBarLabel: 'Sites & Shifts',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ClientReports}
        options={{
          tabBarLabel: 'Reports',
        }}
      />
      <Tab.Screen
        name="Guards"
        component={ClientGuards}
        options={{
          tabBarLabel: 'Guards',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={ClientSettingsStackNavigator}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    height: 70,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default ClientNavigator;

