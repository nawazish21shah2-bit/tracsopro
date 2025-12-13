import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ClientNavigator from './ClientNavigator';
import AddSiteScreen from '../screens/client/AddSiteScreen';
import SiteDetailsScreen from '../screens/client/SiteDetailsScreen';
import CreateShiftScreen from '../screens/client/CreateShiftScreen';
import ClientNotifications from '../screens/client/ClientNotifications';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import PaymentScreen from '../screens/client/PaymentScreen';
import InvoiceDetailsScreen from '../screens/client/InvoiceDetailsScreen';
import PaymentMethodsScreen from '../screens/client/PaymentMethodsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import SupportContactScreen from '../screens/settings/SupportContactScreen';
import CompanyDetailsScreen from '../screens/settings/CompanyDetailsScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';

export type ClientStackParamList = {
  ClientTabs: undefined;
  AddSite: undefined;
  SiteDetails: { siteId: string };
  CreateShift: { siteId: string };
  ClientNotifications: undefined;
  NotificationSettings: undefined;
  ProfileEdit: undefined;
  SupportContact: undefined;
  CompanyDetails: undefined;
  ClientChangePassword: undefined;
  IndividualChatScreen: {
    chatId: string;
    chatName: string;
    avatar?: string;
    context?: 'report' | 'site' | 'general';
  };
  ChatListScreen: undefined;
  Payment: undefined;
  InvoiceDetails: { invoiceId: string };
  PaymentMethods: undefined;
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
        name="NotificationSettings" 
        component={NotificationSettingsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SupportContact" 
        component={SupportContactScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CompanyDetails" 
        component={CompanyDetailsScreen} 
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
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="InvoiceDetails" 
        component={InvoiceDetailsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PaymentMethods" 
        component={PaymentMethodsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ClientChangePassword" 
        component={() => <ChangePasswordScreen variant="client" />} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ClientStackNavigator;
