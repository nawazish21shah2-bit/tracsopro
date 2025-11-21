import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import GuardCard from '../../components/client/GuardCard';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';

interface GuardData {
  id: string;
  name: string;
  avatar?: string;
  site?: string;
  shiftTime?: string;
  status: 'Active' | 'Upcoming' | 'Missed' | 'Completed';
  checkInTime?: string;
  pastJobs: number;
  rating: number;
  availability: string;
}

const ClientGuards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const [guards, setGuards] = useState<GuardData[]>([
    {
      id: '1',
      name: 'Mark Husdon',
      pastJobs: 13,
      rating: 4.5,
      availability: 'Available today',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Mark Husdon',
      pastJobs: 13,
      rating: 4.5,
      availability: 'Available today',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Mark Husdon',
      pastJobs: 13,
      rating: 4.5,
      availability: 'Available today',
      status: 'Active',
    },
    {
      id: '4',
      name: 'Mark Husdon',
      pastJobs: 13,
      rating: 4.5,
      availability: 'Available today',
      status: 'Active',
    },
  ]);

  const handlePostNewShift = () => {
    console.log('Post new shift');
  };

  const handleGuardPress = (guardId: string) => {
    console.log('Guard pressed:', guardId);
  };

  const handleHireGuard = (guardId: string) => {
    console.log('Hire guard:', guardId);
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="client"
        title="Guards"
        rightIcon={
          <TouchableOpacity style={styles.postButton} onPress={handlePostNewShift}>
            <Text style={styles.postButtonText}>Post New shift</Text>
          </TouchableOpacity>
        }
        profileDrawer={
          <ClientProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToGuards={() => {
              closeDrawer();
            }}
          />
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {guards.map((guard) => (
          <GuardCard
            key={guard.id}
            guard={guard}
            onPress={() => handleGuardPress(guard.id)}
            onHire={() => handleHireGuard(guard.id)}
            showHireButton={true}
          />
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  postButton: {
    backgroundColor: '#1C6CA9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default ClientGuards;
