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
        tabBarIcon: ({ focused, color, size }) => {
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
            <View style={styles.tabIconContainer}>
              <IconComponent 
                size={size} 
                color={focused ? '#1C6CA9' : '#666666'} 
              />
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={[
            styles.tabLabel,
            { color: focused ? '#1C6CA9' : '#666666' }
          ]}>
            {route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1C6CA9',
        tabBarInactiveTintColor: '#666666',
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
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default ClientNavigator;
