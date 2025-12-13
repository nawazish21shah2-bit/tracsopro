
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { HomeIcon, ShiftsIcon, ReportsIcon, SettingsIcon, UserIcon } from '../components/ui/AppIcons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/globalStyles';

// Import Client Screens
import ClientDashboard from '../screens/client/ClientDashboard';
import ClientSites from '../screens/client/ClientSites';
import ClientReports from '../screens/client/ClientReports';
import ClientGuards from '../screens/client/ClientGuards';
import ClientSettings from '../screens/client/ClientSettings';

export type ClientTabParamList = {
  Dashboard: undefined;
  'Sites & Shifts': undefined;
  Reports: undefined;
  Guards: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<ClientTabParamList>();

const ClientNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let IconComponent;

          switch (route.name) {
            case 'Dashboard':
              IconComponent = HomeIcon;
              break;
            case 'Sites & Shifts':
              IconComponent = ShiftsIcon;
              break;
            case 'Reports':
              IconComponent = ReportsIcon;
              break;
            case 'Guards':
              IconComponent = UserIcon;
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
        component={ClientSettings}
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
});

export default ClientNavigator;

