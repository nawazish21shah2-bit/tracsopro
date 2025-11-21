import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardNavigator from './DashboardNavigator';
import AvailableShiftsScreen from '../screens/guard/AvailableShiftsScreen';
import ApplyForShiftScreen from '../screens/guard/ApplyForShiftScreen';
import CheckInOutScreen from '../screens/guard/CheckInOutScreen';
import GuardSiteDetailsScreen from '../screens/guard/GuardSiteDetailsScreen';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';

export type GuardStackParamList = {
  GuardTabs: undefined;
  AvailableShifts: undefined;
  ShiftDetails: { shiftId: string };
  ApplyForShift: { shiftId: string };
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
      <Stack.Screen name="AvailableShifts" component={AvailableShiftsScreen} />
      <Stack.Screen name="ApplyForShift" component={ApplyForShiftScreen} />
      <Stack.Screen name="GuardSiteDetails" component={GuardSiteDetailsScreen} />
      <Stack.Screen name="CheckInOut" component={CheckInOutScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="IndividualChatScreen" component={IndividualChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatListScreen" component={ChatListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatScreen" component={IndividualChatScreen} />
    </Stack.Navigator>
  );
};

export default GuardStackNavigator;
