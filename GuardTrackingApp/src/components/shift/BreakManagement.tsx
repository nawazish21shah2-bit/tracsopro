import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  startShiftBreak,
  endShiftBreak,
} from '../../store/slices/shiftSlice';
import { Shift } from '../../types/shift.types';

interface BreakManagementProps {
  shift: Shift;
  style?: any;
}

interface BreakType {
  id: string;
  name: string;
  maxDuration: number; // in minutes
  icon: string;
}

const BREAK_TYPES: BreakType[] = [
  { id: 'LUNCH', name: 'Lunch Break', maxDuration: 60, icon: '🍽️' },
  { id: 'REST', name: 'Rest Break', maxDuration: 15, icon: '☕' },
  { id: 'BATHROOM', name: 'Bathroom Break', maxDuration: 10, icon: '🚻' },
  { id: 'EMERGENCY', name: 'Emergency Break', maxDuration: 30, icon: '🚨' },
  { id: 'OTHER', name: 'Other', maxDuration: 30, icon: '⏱️' },
];

const BreakManagement: React.FC<BreakManagementProps> = ({ shift, style }) => {
  const dispatch = useDispatch();
  const { breakLoading, currentBreak } = useSelector(
    (state: RootState) => state.shifts
  );

  const [showBreakModal, setShowBreakModal] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState<BreakType | null>(null);
  const [breakNotes, setBreakNotes] = useState('');

  const isOnBreak = currentBreak && !currentBreak.endTime;

  const handleStartBreak = async (breakType: BreakType) => {
    try {
      await dispatch(startShiftBreak({
        shiftId: shift.id,
        breakType: breakType.id,
        notes: breakNotes || undefined,
      }) as any);

      setShowBreakModal(false);
      setBreakNotes('');
      setSelectedBreakType(null);

      Alert.alert(
        'Break Started',
        `${breakType.name} has been started. Don't forget to end it when you're done!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to start break. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEndBreak = async () => {
    if (!currentBreak) return;

    Alert.alert(
      'End Break',
      'Are you sure you want to end your current break?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Break',
          onPress: async () => {
            try {
              await dispatch(endShiftBreak({
                shiftId: shift.id,
                breakId: currentBreak.id,
                notes: breakNotes || undefined,
              }) as any);

              setBreakNotes('');

              Alert.alert(
                'Break Ended',
                'Your break has been successfully ended.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to end break. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const getBreakDuration = (): string => {
    if (!currentBreak || !currentBreak.startTime) return '00:00';

    const startTime = new Date(currentBreak.startTime);
    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getCurrentBreakType = (): BreakType | null => {
    if (!currentBreak) return null;
    return BREAK_TYPES.find(type => type.id === currentBreak.type) || null;
  };

  if (shift.status !== 'IN_PROGRESS') {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.unavailableText}>
          Break management is only available during active shifts
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {isOnBreak ? (
        // Currently on break
        <View style={styles.activeBreakContainer}>
          <View style={styles.breakHeader}>
            <Text style={styles.activeBreakTitle}>
              {getCurrentBreakType()?.icon} On Break
            </Text>
            <Text style={styles.breakDuration}>{getBreakDuration()}</Text>
          </View>
          
          <Text style={styles.breakType}>
            {getCurrentBreakType()?.name || 'Unknown Break'}
          </Text>
          
          {currentBreak?.notes && (
            <Text style={styles.breakNotes}>Notes: {currentBreak.notes}</Text>
          )}

          <TouchableOpacity
            style={styles.endBreakButton}
            onPress={handleEndBreak}
            disabled={breakLoading}
          >
            <Text style={styles.endBreakButtonText}>
              {breakLoading ? 'Ending...' : 'End Break'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Not on break
        <View style={styles.startBreakContainer}>
          <Text style={styles.sectionTitle}>Break Management</Text>
          <Text style={styles.sectionSubtitle}>
            Take a break during your shift
          </Text>

          <TouchableOpacity
            style={styles.startBreakButton}
            onPress={() => setShowBreakModal(true)}
            disabled={breakLoading}
          >
            <Text style={styles.startBreakButtonText}>
              {breakLoading ? 'Starting...' : '⏸️ Start Break'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Break Type Selection Modal */}
      <Modal
        visible={showBreakModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBreakModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Break Type</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBreakModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {BREAK_TYPES.map((breakType) => (
              <TouchableOpacity
                key={breakType.id}
                style={[
                  styles.breakTypeOption,
                  selectedBreakType?.id === breakType.id && styles.selectedBreakType,
                ]}
                onPress={() => setSelectedBreakType(breakType)}
              >
                <Text style={styles.breakTypeIcon}>{breakType.icon}</Text>
                <View style={styles.breakTypeInfo}>
                  <Text style={styles.breakTypeName}>{breakType.name}</Text>
                  <Text style={styles.breakTypeDuration}>
                    Max: {breakType.maxDuration} minutes
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={breakNotes}
                onChangeText={setBreakNotes}
                placeholder="Add any notes about this break..."
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowBreakModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedBreakType && styles.disabledButton,
              ]}
              onPress={() => selectedBreakType && handleStartBreak(selectedBreakType)}
              disabled={!selectedBreakType || breakLoading}
            >
              <Text style={styles.confirmButtonText}>
                {breakLoading ? 'Starting...' : 'Start Break'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unavailableText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
  activeBreakContainer: {
    alignItems: 'center',
  },
  breakHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  activeBreakTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 4,
  },
  breakDuration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  breakType: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  breakNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  endBreakButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  endBreakButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startBreakContainer: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  startBreakButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startBreakButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  breakTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  selectedBreakType: {
    borderColor: '#1C6CA9',
    backgroundColor: '#EBF8FF',
  },
  breakTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  breakTypeInfo: {
    flex: 1,
  },
  breakTypeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  breakTypeDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  notesContainer: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1C6CA9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BreakManagement;
