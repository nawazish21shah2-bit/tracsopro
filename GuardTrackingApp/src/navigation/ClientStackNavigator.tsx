import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ClientNavigator from './ClientNavigator';
import AddSiteScreen from '../screens/client/AddSiteScreen';
import SiteDetailsScreen from '../screens/client/SiteDetailsScreen';
import CreateShiftScreen from '../screens/client/CreateShiftScreen';
import ClientNotifications from '../screens/client/ClientNotifications';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';

export type ClientStackParamList = {
  ClientTabs: undefined;
  AddSite: undefined;
  SiteDetails: { siteId: string };
  CreateShift: undefined;
  ClientNotifications: undefined;
  IndividualChatScreen: {
    chatId: string;
    chatName: string;
    avatar?: string;
    context?: 'report' | 'site' | 'general';
  };
  ChatListScreen: undefined;
};

const Stack = createStackNavigator<ClientStackParamList>();

const ClientStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ClientTabs" component={ClientNavigator} />
      <Stack.Screen name="AddSite" component={AddSiteScreen} />
      <Stack.Screen name="SiteDetails" component={SiteDetailsScreen} />
      <Stack.Screen name="CreateShift" component={CreateShiftScreen} />
      <Stack.Screen 
        name="ClientNotifications" 
        component={ClientNotifications} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="IndividualChatScreen" 
        component={IndividualChatScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ChatListScreen" 
        component={ChatListScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ClientStackNavigator;
