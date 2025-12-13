import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardNavigator from './DashboardNavigator';
// REMOVED: AvailableShiftsScreen and ApplyForShiftScreen - Job board system removed (Option B)
import CheckInOutScreen from '../screens/guard/CheckInOutScreen';
import GuardSiteDetailsScreen from '../screens/guard/GuardSiteDetailsScreen';
import ShiftDetailsScreen from '../screens/guard/ShiftDetailsScreen';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import GuardSettingsScreen from '../screens/guard/GuardSettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import SupportContactScreen from '../screens/settings/SupportContactScreen';

export type GuardStackParamList = {
  GuardTabs: undefined;
  ShiftDetails: { shiftId: string };
  GuardSiteDetails: { siteId: string };
  CheckInOut: { assignmentId: string };
  Chat: { roomId?: string; roomName?: string };
  ChatScreen: { chatId: string; chatName: string; avatar?: string };
  IndividualChatScreen: {
    chatId: string;
    chatName: string;
    avatar?: string;
    context?: 'report' | 'site' | 'general';
  };
  ChatListScreen: undefined;
  Notifications: undefined;
  GuardSettings: undefined;
  GuardNotificationSettings: undefined;
  GuardProfileEdit: undefined;
  GuardChangePassword: undefined;
  GuardSupportContact: undefined;
};

const Stack = createStackNavigator<GuardStackParamList>();

const GuardStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="GuardTabs" component={DashboardNavigator} />
      <Stack.Screen name="ShiftDetails" component={ShiftDetailsScreen} />
      <Stack.Screen name="GuardSiteDetails" component={GuardSiteDetailsScreen} />
      <Stack.Screen name="CheckInOut" component={CheckInOutScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="IndividualChatScreen" component={IndividualChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatListScreen" component={ChatListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatScreen" component={IndividualChatScreen} />
      <Stack.Screen 
        name="Notifications" 
        component={() => <NotificationListScreen variant="guard" />} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="GuardSettings" 
        component={GuardSettingsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="GuardNotificationSettings" 
        component={() => <NotificationSettingsScreen variant="guard" />} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="GuardProfileEdit" 
        component={() => <ProfileEditScreen variant="guard" />} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="GuardChangePassword" 
        component={() => <ChangePasswordScreen variant="guard" />} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="GuardSupportContact" 
        component={() => <SupportContactScreen variant="guard" />} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

export default GuardStackNavigator;
