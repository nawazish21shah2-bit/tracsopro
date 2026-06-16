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
import SupportHubScreen from '../screens/support/SupportHubScreen';
import SupportTicketDetailScreen from '../screens/support/SupportTicketDetailScreen';
import CompanyDetailsScreen from '../screens/settings/CompanyDetailsScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import ShiftDetailsScreen from '../screens/shifts/ShiftDetailsScreen';
import EditShiftScreen from '../screens/shifts/EditShiftScreen';
import ClientMyShiftsScreen from '../screens/client/ClientMyShiftsScreen';
import ClientGuardDetailsScreen from '../screens/client/ClientGuardDetailsScreen';

export type ClientStackParamList = {
  ClientTabs: undefined;
  AddSite: undefined;
  SiteDetails: { siteId: string };
  CreateShift: { siteId: string };
  ClientNotifications: undefined;
  NotificationSettings: undefined;
  ProfileEdit: undefined;
  SupportContact: undefined;
  SupportHubScreen: { variant?: 'client'; mode?: 'mine' | 'inbox' | 'platform' };
  SupportTicketDetailScreen: {
    ticketId: string;
    variant?: 'client';
    mode?: 'mine' | 'inbox' | 'platform';
  };
  CompanyDetails: undefined;
  ClientChangePassword: undefined;
  IndividualChatScreen: {
    chatId: string;
    chatName: string;
    avatar?: string;
    context?: 'report' | 'site' | 'general' | 'support';
  };
  ChatListScreen: undefined;
  Payment: undefined;
  InvoiceDetails: { invoiceId: string };
  PaymentMethods: undefined;
  ShiftDetails: { shiftId: string; shift?: any };
  EditShift: { shiftId: string; shift?: any };
  ClientMyShifts: undefined;
  ClientGuardDetails: {
    guardId: string;
    guardName?: string;
    userId?: string;
    avatar?: string;
    shiftId?: string;
  };
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
        name="SupportHubScreen"
        component={SupportHubScreen}
        initialParams={{ variant: 'client', mode: 'mine' }}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SupportTicketDetailScreen"
        component={SupportTicketDetailScreen}
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
      <Stack.Screen name="ShiftDetails" component={ShiftDetailsScreen} />
      <Stack.Screen name="EditShift" component={EditShiftScreen} />
      <Stack.Screen name="ClientMyShifts" component={ClientMyShiftsScreen} />
      <Stack.Screen name="ClientGuardDetails" component={ClientGuardDetailsScreen} />
    </Stack.Navigator>
  );
};

export default ClientStackNavigator;
