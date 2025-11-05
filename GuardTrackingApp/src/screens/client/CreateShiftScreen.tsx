import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Save, Clock, DollarSign, Users } from 'react-native-feather';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

interface ShiftFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  hourlyRate: string;
  maxGuards: string;
  requirements: string;
}

const CreateShiftScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { siteId } = route.params as { siteId: string };
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ShiftFormData>({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    hourlyRate: '',
    maxGuards: '1',
    requirements: '',
  });

  const handleInputChange = (field: keyof ShiftFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Shift title is required');
      return false;
    }
    if (!formData.startDate || !formData.startTime) {
      Alert.alert('Error', 'Start date and time are required');
      return false;
    }
    if (!formData.endDate || !formData.endTime) {
      Alert.alert('Error', 'End date and time are required');
      return false;
    }
    if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
      Alert.alert('Error', 'Valid hourly rate is required');
      return false;
    }
    return true;
  };

  const handleCreateShift = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Integrate with backend API
      console.log('Creating shift for site:', siteId, formData);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success',
        'Shift posting created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create shift posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft width={24} height={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Shift</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleCreateShift}
          disabled={loading}
        >
          <Save width={20} height={20} color="#1C6CA9" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shift Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shift Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shift Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder="e.g., Night Security Guard"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Brief description of the shift duties"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.requirements}
              onChangeText={(value) => handleInputChange('requirements', value)}
              placeholder="Specific requirements for this shift"
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock width={20} height={20} color="#1C6CA9" />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Start Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.startDate}
                onChangeText={(value) => handleInputChange('startDate', value)}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Start Time *</Text>
              <TextInput
                style={styles.input}
                value={formData.startTime}
                onChangeText={(value) => handleInputChange('startTime', value)}
                placeholder="HH:MM AM/PM"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>End Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.endDate}
                onChangeText={(value) => handleInputChange('endDate', value)}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>End Time *</Text>
              <TextInput
                style={styles.input}
                value={formData.endTime}
                onChangeText={(value) => handleInputChange('endTime', value)}
                placeholder="HH:MM AM/PM"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Compensation & Capacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compensation & Capacity</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <View style={styles.labelRow}>
                <DollarSign width={16} height={16} color="#666" />
                <Text style={styles.label}>Hourly Rate *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.hourlyRate}
                onChangeText={(value) => handleInputChange('hourlyRate', value)}
                placeholder="25.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <View style={styles.labelRow}>
                <Users width={16} height={16} color="#666" />
                <Text style={styles.label}>Max Guards</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.maxGuards}
                onChangeText={(value) => handleInputChange('maxGuards', value)}
                placeholder="1"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateShift}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating Shift...' : 'Create Shift Posting'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  createButton: {
    backgroundColor: '#1C6CA9',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateShiftScreen;
