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
import { MenuIcon, NotificationIcon } from '../../components/ui/AppIcons';
import GuardCard from '../../components/client/GuardCard';

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <MenuIcon size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guards</Text>
        <TouchableOpacity style={styles.postButton} onPress={handlePostNewShift}>
          <Text style={styles.postButtonText}>Post New shift</Text>
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
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
