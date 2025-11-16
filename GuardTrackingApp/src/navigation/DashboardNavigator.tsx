// Dashboard Navigator
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import GuardHomeScreen from '../screens/dashboard/GuardHomeScreen';
import MyShiftsScreen from '../screens/dashboard/MyShiftsScreen';
import ReportsScreen from '../screens/dashboard/ReportsScreen';
import AvailableShiftsScreen from '../screens/guard/AvailableShiftsScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import { COLORS } from '../styles/globalStyles';
import { HomeIcon, ShiftsIcon, ReportsIcon, JobsIcon, ClockIcon } from '../components/ui/AppIcons';

export type DashboardTabParamList = {
  Home: undefined;
  'My Shifts': undefined;
  Chat: undefined;
  Reports: undefined;
  Jobs: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();


import CheckInScreen from '../screens/CheckInScreen';

const DashboardNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1C6CA9',
        tabBarInactiveTintColor: '#7A7A7A',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 6,
          paddingTop: 6,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={GuardHomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <HomeIcon size={20} color={focused ? '#1C6CA9' : '#7A7A7A'} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <ReportsIcon size={20} color={focused ? '#1C6CA9' : '#7A7A7A'} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="My Shifts" 
        component={MyShiftsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <ShiftsIcon size={20} color={focused ? '#1C6CA9' : '#7A7A7A'} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <ReportsIcon size={20} color={focused ? '#1C6CA9' : '#7A7A7A'} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Jobs" 
        component={AvailableShiftsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <JobsIcon size={20} color={focused ? '#1C6CA9' : '#7A7A7A'} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default DashboardNavigator;

const styles = StyleSheet.create({
  tabIconWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabIconWrapperActive: {
    backgroundColor: 'rgba(28,108,169,0.2)',
  },
});
