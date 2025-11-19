
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { HomeIcon, ShiftsIcon, ReportsIcon, SettingsIcon, UserIcon } from '../components/ui/AppIcons';

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
                color={focused ? '#1C6CA9' : '#7A7A7A'}
              />
            </View>
          );
        },
        tabBarLabel: ({ focused }) => (
          <Text
            style={[
              styles.tabLabel,
              { color: focused ? '#1C6CA9' : '#7A7A7A' },
            ]}
          >
            {route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1C6CA9',
        tabBarInactiveTintColor: '#7A7A7A',
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0F0FA',
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
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
});

export default ClientNavigator;

