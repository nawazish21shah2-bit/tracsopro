
// Dashboard Navigator
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import GuardHomeScreen from '../screens/dashboard/GuardHomeScreen';
import MyShiftsScreen from '../screens/dashboard/MyShiftsScreen';
import ReportsScreen from '../screens/dashboard/ReportsScreen';
import AvailableShiftsScreen from '../screens/guard/AvailableShiftsScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import { HomeIcon, ShiftsIcon, ReportsIcon, JobsIcon } from '../components/ui/AppIcons';

export type DashboardTabParamList = {
  Home: undefined;
  Chat: undefined;
  'My Shifts': undefined;
  Reports: undefined;
  Jobs: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();

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
          borderTopColor: '#E0F0FA',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 10,
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
          tabBarIcon: ({ focused }) => (
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
          tabBarIcon: ({ focused }) => (
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
          tabBarIcon: ({ focused }) => (
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
          tabBarIcon: ({ focused }) => (
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
          tabBarIcon: ({ focused }) => (
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

