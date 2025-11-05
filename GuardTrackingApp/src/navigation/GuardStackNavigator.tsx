import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardNavigator from './DashboardNavigator';
import AvailableShiftsScreen from '../screens/guard/AvailableShiftsScreen';
import ApplyForShiftScreen from '../screens/guard/ApplyForShiftScreen';
import CheckInOutScreen from '../screens/guard/CheckInOutScreen';

export type GuardStackParamList = {
  GuardTabs: undefined;
  AvailableShifts: undefined;
  ShiftDetails: { shiftId: string };
  ApplyForShift: { shiftId: string };
  CheckInOut: { assignmentId: string };
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
      <Stack.Screen name="CheckInOut" component={CheckInOutScreen} />
    </Stack.Navigator>
  );
};

export default GuardStackNavigator;
