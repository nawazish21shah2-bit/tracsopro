/**
 * Shift Scheduling Screen - Phase 6
 * Advanced scheduling with conflict detection and guard assignment
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { ErrorHandler } from '../../utils/errorHandler';
import apiService from '../../services/api';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { ShiftsIcon, UserIcon, EmergencyIcon, LocationIcon, ClockIcon } from '../../components/ui/AppIcons';
import { ArrowLeftIcon, ArrowRightIcon } from '../../components/ui/FeatherIcons';

interface ScheduledShift {
  id: string;
  guardId: string;
  guardName: string;
  siteId: string;
  siteName: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  shiftType: 'regular' | 'overtime' | 'emergency' | 'replacement';
  notes?: string;
  conflicts?: ConflictInfo[];
}

interface ConflictInfo {
  type: 'guard_unavailable' | 'site_overlap' | 'overtime_limit' | 'rest_period';
  message: string;
  severity: 'warning' | 'error';
  conflictingShiftId?: string;
}

interface Guard {
  id: string;
  name: string;
  department: string;
  skills: string[];
  availability: {
    [date: string]: {
      available: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
    };
  };
  maxHoursPerWeek: number;
  currentWeekHours: number;
}

interface Site {
  id: string;
  name: string;
  address: string;
  requiredSkills: string[];
  maxGuards: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ShiftSchedulingScreenProps {
  navigation: any;
}

const ShiftSchedulingScreen: React.FC<ShiftSchedulingScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutUser()).unwrap();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const [shifts, setShifts] = useState<ScheduledShift[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedView, setSelectedView] = useState<'calendar' | 'conflicts' | 'guards'>('calendar');
  const [loading, setLoading] = useState(false);

  const [newShift, setNewShift] = useState({
    guardId: '',
    siteId: '',
    startTime: '09:00',
    endTime: '17:00',
    date: selectedDate,
    shiftType: 'regular' as ScheduledShift['shiftType'],
    notes: '',
  });

  useEffect(() => {
    initializeScheduling();
  }, []);

  const initializeScheduling = async () => {
    try {
      setLoading(true);
      await loadShifts();
      await loadGuards();
      await loadSites();
      
      console.log('📅 Shift Scheduling initialized');
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_scheduling');
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    // Mock scheduled shifts
    const mockShifts: ScheduledShift[] = [
      {
        id: 'shift_1',
        guardId: 'guard_1',
        guardName: 'John Smith',
        siteId: 'site_1',
        siteName: 'Central Office',
        startTime: '09:00',
        endTime: '17:00',
        date: selectedDate,
        status: 'scheduled',
        shiftType: 'regular',
      },
      {
        id: 'shift_2',
        guardId: 'guard_2',
        guardName: 'Sarah Johnson',
        siteId: 'site_2',
        siteName: 'Warehouse A',
        startTime: '18:00',
        endTime: '02:00',
        date: selectedDate,
        status: 'confirmed',
        shiftType: 'regular',
        conflicts: [
          {
            type: 'overtime_limit',
            message: 'Guard approaching weekly overtime limit (38/40 hours)',
            severity: 'warning',
          },
        ],
      },
    ];

    setShifts(mockShifts);
  };

  const loadGuards = async () => {
    try {
      const response = await apiService.getGuards(1, 50);
      const responseData = response.data as any;
      if (!response.success || !responseData || !responseData.items) {
        console.warn('Failed to load guards, falling back to mock guards');
        return;
      }

      const backendGuards = responseData.items as any[];

      const mapped: Guard[] = backendGuards.map((g, index) => {
        // Access user data from nested user object
        const firstName = g.user?.firstName || '';
        const lastName = g.user?.lastName || '';
        const email = g.user?.email || '';
        const name = `${firstName} ${lastName}`.trim() || email || `Guard ${index + 1}`;
        // Dummy schedule/skills for UI only
        const skills = ['patrol', 'access_control', 'emergency_response'];
        const maxHoursPerWeek = 40;
        const currentWeekHours = 24 + (index * 4) % 16;

        return {
          id: g.id,
          name,
          department: g.department || 'Security',
          skills,
          availability: {
            [selectedDate]: { available: true, startTime: '08:00', endTime: '20:00' },
          },
          maxHoursPerWeek,
          currentWeekHours,
        } as Guard;
      });

      setGuards(mapped);
    } catch (error) {
      console.error('Failed to load guards for scheduling, keeping mock list', error);
    }
  };

  const loadSites = async () => {
    try {
      const response = await apiService.getAdminSites();
      if (!response.success || !response.data) {
        console.warn('Failed to load sites for scheduling, keeping mock sites');
        return;
      }

      const backendSites = response.data.sites as any[];

      const mapped: Site[] = backendSites.map((s, index) => {
        const priorities: Site['priority'][] = ['low', 'medium', 'high', 'critical'];
        const priority = priorities[index % priorities.length];
        return {
          id: s.id,
          name: s.name,
          address: s.address,
          requiredSkills: ['patrol'],
          maxGuards: 2,
          priority,
        };
      });

      setSites(mapped);
    } catch (error) {
      console.error('Failed to load sites for scheduling, keeping mock sites', error);
    }
  };

  const detectConflicts = (shiftData: typeof newShift): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = [];
    
    const guard = guards.find(g => g.id === shiftData.guardId);
    const site = sites.find(s => s.id === shiftData.siteId);
    
    if (!guard || !site) return conflicts;

    // Check guard availability
    const availability = guard.availability[shiftData.date];
    if (!availability?.available) {
      conflicts.push({
        type: 'guard_unavailable',
        message: `Guard is not available on ${shiftData.date}${availability?.reason ? `: ${availability.reason}` : ''}`,
        severity: 'error',
      });
    }

    // Check overtime limits
    const shiftHours = calculateShiftHours(shiftData.startTime, shiftData.endTime);
    if (guard.currentWeekHours + shiftHours > guard.maxHoursPerWeek) {
      conflicts.push({
        type: 'overtime_limit',
        message: `Shift would exceed weekly hour limit (${guard.currentWeekHours + shiftHours}/${guard.maxHoursPerWeek} hours)`,
        severity: guard.currentWeekHours + shiftHours > guard.maxHoursPerWeek + 8 ? 'error' : 'warning',
      });
    }

    // Check site capacity
    const existingShiftsAtSite = shifts.filter(s => 
      s.siteId === shiftData.siteId && 
      s.date === shiftData.date &&
      s.status !== 'cancelled' &&
      isTimeOverlap(s.startTime, s.endTime, shiftData.startTime, shiftData.endTime)
    );
    
    if (existingShiftsAtSite.length >= site.maxGuards) {
      conflicts.push({
        type: 'site_overlap',
        message: `Site capacity exceeded (${existingShiftsAtSite.length + 1}/${site.maxGuards} guards)`,
        severity: 'error',
      });
    }

    // Check required skills
    const hasRequiredSkills = site.requiredSkills.every(skill => guard.skills.includes(skill));
    if (!hasRequiredSkills) {
      const missingSkills = site.requiredSkills.filter(skill => !guard.skills.includes(skill));
      conflicts.push({
        type: 'guard_unavailable',
        message: `Guard missing required skills: ${missingSkills.join(', ')}`,
        severity: 'warning',
      });
    }

    return conflicts;
  };

  const calculateShiftHours = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = new Date(`2000-01-01T${start1}:00`);
    const e1 = new Date(`2000-01-01T${end1}:00`);
    const s2 = new Date(`2000-01-01T${start2}:00`);
    const e2 = new Date(`2000-01-01T${end2}:00`);
    
    // Handle overnight shifts
    if (e1 < s1) e1.setDate(e1.getDate() + 1);
    if (e2 < s2) e2.setDate(e2.getDate() + 1);
    
    return s1 < e2 && s2 < e1;
  };

  const handleCreateShift = async () => {
    try {
      const conflicts = detectConflicts(newShift);
      const hasErrors = conflicts.some(c => c.severity === 'error');
      
      if (hasErrors) {
        Alert.alert(
          'Scheduling Conflicts',
          conflicts.filter(c => c.severity === 'error').map(c => c.message).join('\n'),
          [{ text: 'OK' }]
        );
        return;
      }

      const guard = guards.find(g => g.id === newShift.guardId);
      const site = sites.find(s => s.id === newShift.siteId);
      
      if (!guard || !site) {
        Alert.alert('Error', 'Please select both guard and site');
        return;
      }

      const shift: ScheduledShift = {
        id: `shift_${Date.now()}`,
        guardId: newShift.guardId,
        guardName: guard.name,
        siteId: newShift.siteId,
        siteName: site.name,
        startTime: newShift.startTime,
        endTime: newShift.endTime,
        date: newShift.date,
        status: 'scheduled',
        shiftType: newShift.shiftType,
        notes: newShift.notes,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
      // Persist to backend (admin shift create) using dummy-compatible payload
      const scheduledStartTime = `${newShift.date}T${newShift.startTime}:00`;
      const scheduledEndTime = `${newShift.date}T${newShift.endTime}:00`;

      const apiResponse = await apiService.createAdminShift({
        guardId: guard.id,
        siteId: site.id, // Link shift to site (will automatically link to client)
        locationName: site.name, // Fallback if siteId lookup fails
        locationAddress: site.address, // Fallback if siteId lookup fails
        scheduledStartTime,
        scheduledEndTime,
        description: newShift.shiftType,
        notes: newShift.notes,
      });

      if (!apiResponse.success) {
        Alert.alert('Error', apiResponse.message || 'Failed to create shift in backend');
        return;
      }

      setShifts(prev => [...prev, shift]);
      setShowCreateModal(false);
      
      // Reset form
      setNewShift({
        guardId: '',
        siteId: '',
        startTime: '09:00',
        endTime: '17:00',
        date: selectedDate,
        shiftType: 'regular',
        notes: '',
      });

      Alert.alert(
        'Shift Created',
        conflicts.length > 0 
          ? `Shift created in system with ${conflicts.length} warning(s)`
          : 'Shift created successfully and saved to backend'
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'create_shift');
      Alert.alert('Error', 'Failed to create shift');
    }
  };

  const getStatusColor = (status: ScheduledShift['status']) => {
    switch (status) {
      case 'scheduled': return COLORS.warning;
      case 'confirmed': return COLORS.info;
      case 'in_progress': return COLORS.success;
      case 'completed': return COLORS.textSecondary;
      case 'cancelled': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const renderCalendarView = () => (
    <View style={styles.calendarContainer}>
      <View style={styles.dateSelector}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            const prevDate = new Date(selectedDate);
            prevDate.setDate(prevDate.getDate() - 1);
            setSelectedDate(prevDate.toISOString().split('T')[0]);
          }}
        >
          <ArrowLeftIcon size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
        
        <Text style={styles.selectedDate}>
          {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            setSelectedDate(nextDate.toISOString().split('T')[0]);
          }}
        >
          <ArrowRightIcon size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={shifts.filter(s => s.date === selectedDate)}
        renderItem={({ item }) => (
          <View style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <Text style={styles.shiftGuard}>{item.guardName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.shiftInfoRow}>
              <View style={styles.shiftInfoIconContainer}>
                <LocationIcon size={16} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.shiftSite}>{item.siteName}</Text>
            </View>
            <View style={styles.shiftInfoRow}>
              <View style={styles.shiftInfoIconContainer}>
                <ClockIcon size={16} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.shiftTime}>
                {item.startTime} - {item.endTime} ({calculateShiftHours(item.startTime, item.endTime)}h)
              </Text>
            </View>
            
            {item.conflicts && item.conflicts.length > 0 && (
              <View style={styles.conflictsSection}>
                {item.conflicts.map((conflict, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.conflictText,
                      { color: conflict.severity === 'error' ? COLORS.error : COLORS.warning }
                    ]}
                  >
                    ⚠️ {conflict.message}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No shifts scheduled for this date</Text>
          </View>
        }
      />
    </View>
  );

  const renderCreateShiftModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create New Shift</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Guard</Text>
            <FlatList
              data={guards}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    newShift.guardId === item.id && styles.optionItemSelected,
                  ]}
                  onPress={() => setNewShift(prev => ({ ...prev, guardId: item.id }))}
                >
                  <Text style={[
                    styles.optionText,
                    newShift.guardId === item.id && styles.optionTextSelected,
                  ]}>{item.name}</Text>
                  <Text style={[
                    styles.optionSubtext,
                    newShift.guardId === item.id && styles.optionSubtextSelected,
                  ]}>
                    {item.currentWeekHours}/{item.maxHoursPerWeek}h this week
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Site</Text>
            <FlatList
              data={sites}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    newShift.siteId === item.id && styles.optionItemSelected,
                  ]}
                  onPress={() => setNewShift(prev => ({ ...prev, siteId: item.id }))}
                >
                  <Text style={[
                    styles.optionText,
                    newShift.siteId === item.id && styles.optionTextSelected,
                  ]}>{item.name}</Text>
                  <Text style={[
                    styles.optionSubtext,
                    newShift.siteId === item.id && styles.optionSubtextSelected,
                  ]}>{item.priority} priority</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <View style={styles.timeSection}>
            <View style={styles.timeInput}>
              <Text style={styles.formLabel}>Start Time</Text>
              <TextInput
                style={styles.timeField}
                value={newShift.startTime}
                onChangeText={(text) => setNewShift(prev => ({ ...prev, startTime: text }))}
                placeholder="HH:MM"
              />
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.formLabel}>End Time</Text>
              <TextInput
                style={styles.timeField}
                value={newShift.endTime}
                onChangeText={(text) => setNewShift(prev => ({ ...prev, endTime: text }))}
                placeholder="HH:MM"
              />
            </View>
          </View>

          {newShift.guardId && newShift.siteId && (
            <View style={styles.conflictPreview}>
              <Text style={styles.conflictPreviewTitle}>Conflict Check:</Text>
              {detectConflicts(newShift).map((conflict, index) => (
                <Text
                  key={index}
                  style={[
                    styles.conflictPreviewText,
                    { color: conflict.severity === 'error' ? COLORS.error : COLORS.warning }
                  ]}
                >
                  {conflict.severity === 'error' ? '❌' : '⚠️'} {conflict.message}
                </Text>
              ))}
              {detectConflicts(newShift).length === 0 && (
                <Text style={[styles.conflictPreviewText, { color: COLORS.success }]}>
                  ✅ No conflicts detected
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateShift}
          >
            <Text style={styles.createButtonText}>Create Shift</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Shift Scheduling"
        onMenuPress={openDrawer}
        onNotificationPress={() => {
          // Handle notification press
        }}
        profileDrawer={
          <AdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToScheduling={() => {
              closeDrawer();
            }}
          />
        }
      />
      <View style={styles.container}>

        <View style={styles.viewSelector}>
        {[
          { 
            key: 'calendar', 
            label: 'Calendar', 
            icon: ShiftsIcon,
            iconBgColor: (isActive: boolean) => isActive ? 'rgba(255, 255, 255, 0.2)' : COLORS.secondary,
            iconColor: (isActive: boolean) => isActive ? COLORS.textInverse : COLORS.primary,
          },
          { 
            key: 'conflicts', 
            label: 'Conflicts', 
            icon: EmergencyIcon,
            iconBgColor: (isActive: boolean) => isActive ? 'rgba(255, 255, 255, 0.2)' : '#FEEBEB',
            iconColor: (isActive: boolean) => isActive ? COLORS.textInverse : COLORS.error,
          },
          { 
            key: 'guards', 
            label: 'Guards', 
            icon: UserIcon,
            iconBgColor: (isActive: boolean) => isActive ? 'rgba(255, 255, 255, 0.2)' : '#DCFCE7',
            iconColor: (isActive: boolean) => isActive ? COLORS.textInverse : COLORS.success,
          },
        ].map((view) => {
          const isActive = selectedView === view.key;
          const IconComponent = view.icon;
          const iconBgColor = view.iconBgColor(isActive);
          const iconColor = view.iconColor(isActive);
          return (
            <TouchableOpacity
              key={view.key}
              style={[
                styles.viewTab,
                isActive && styles.viewTabActive,
              ]}
              onPress={() => setSelectedView(view.key as any)}
            >
              <View style={styles.viewTabIconContainer}>
                <View style={[
                  styles.viewTabIcon, 
                  { backgroundColor: iconBgColor },
                  isActive && styles.viewTabIconActive
                ]}>
                  <IconComponent size={18} color={iconColor} />
                </View>
              </View>
              <Text style={[
                styles.viewTabText,
                isActive && styles.viewTabTextActive,
              ]}>
                {view.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

        {selectedView === 'calendar' && renderCalendarView()}
        
        {renderCreateShiftModal()}
      </View>

      {/* Sticky Action Button */}
      <TouchableOpacity 
        style={styles.stickyAddButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.stickyAddButtonText}>+ Add Shift</Text>
      </TouchableOpacity>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
  },
  stickyAddButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
    zIndex: 1000,
  },
  stickyAddButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPrimary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  viewTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg - 1,
    minHeight: 59,
    justifyContent: 'center',
    backgroundColor: '#ECECEC',
  },
  viewTabActive: {
    backgroundColor: COLORS.primary,
  },
  viewTabIconContainer: {
    marginBottom: SPACING.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewTabIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  viewTabIconActive: {
    // Background color is set dynamically in component
  },
  viewTabText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  viewTabTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  calendarContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDate: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  shiftCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  shiftGuard: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  shiftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  shiftInfoIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  shiftSite: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  shiftTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  conflictsSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  conflictText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: SPACING.xs,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  optionItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    minWidth: 120,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  optionItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    color: COLORS.textInverse,
  },
  optionSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  optionSubtextSelected: {
    color: COLORS.textInverse,
    opacity: 0.9,
  },
  timeSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  timeInput: {
    flex: 1,
  },
  timeField: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  conflictPreview: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  conflictPreviewTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  conflictPreviewText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.xs,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  createButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default ShiftSchedulingScreen;
