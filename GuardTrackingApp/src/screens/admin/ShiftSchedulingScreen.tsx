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
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { ErrorHandler } from '../../utils/errorHandler';
import { showSchedulingErrorAlert, showShiftActionError } from '../../utils/schedulingErrorAlert';
import { shiftApi } from '../../services/api/shiftApi';
import { adminApi } from '../../services/api/adminApi';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { ShiftsIcon, UserIcon, EmergencyIcon, LocationIcon, ClockIcon, PlusIcon, CheckCircleIcon, InfoIcon } from '../../components/ui/AppIcons';
import { ArrowLeftIcon, ArrowRightIcon, RefreshCwIcon, AlertTriangleIcon, EditIcon, TrashIcon } from '../../components/ui/FeatherIcons';
import SectionHeader from '../../components/ui/SectionHeader';
import ShiftFormFields, { ShiftFormValues } from '../../components/shifts/ShiftFormFields';
import FormInput from '../../components/common/FormInput';
import ShiftOptionPicker from '../../components/shifts/ShiftOptionPicker';
import {
  combineDateTime,
  getDefaultShiftSchedule,
  getRepeatSuccessMessage,
  validateShiftSchedule,
} from '../../utils/shiftFormUtils';
import { useShiftScheduling } from '../../features/shift-scheduling/hooks/useShiftScheduling';

interface ScheduledShift {
  id: string;
  guardId?: string | null; // Optional - can be unassigned
  guardName?: string; // Optional - shows "Unassigned" if null
  siteId: string;
  siteName: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  shiftType: 'regular' | 'overtime' | 'emergency' | 'replacement';
  notes?: string;
  conflicts?: ConflictInfo[];
  clientName?: string; // Client who created the shift (if created by client)
  isClientCreated?: boolean; // Flag to identify client-created shifts
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
  const insets = useSafeAreaInsets();
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

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { shifts, loading: shiftsLoading, refresh: reloadShifts, setShifts } = useShiftScheduling(selectedDate);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedView, setSelectedView] = useState<'calendar' | 'conflicts' | 'guards' | 'unassigned'>('calendar');
  const [actionLoading, setActionLoading] = useState(false);
  const isBusy = actionLoading || shiftsLoading;
  const [unassignedShifts, setUnassignedShifts] = useState<ScheduledShift[]>([]);
  const [showAssignGuardModal, setShowAssignGuardModal] = useState(false);
  const [selectedShiftForAssignment, setSelectedShiftForAssignment] = useState<ScheduledShift | null>(null);
  const [selectedGuardIdForAssignment, setSelectedGuardIdForAssignment] = useState<string>('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState<ScheduledShift | null>(null);
  const [editForm, setEditForm] = useState({ startTime: '', endTime: '', notes: '' });

  const buildEmptyShiftForm = (date = selectedDate): ShiftFormValues & { guardId: string; siteId: string } => ({
    guardId: '',
    siteId: '',
    ...getDefaultShiftSchedule(date),
    description: '',
    notes: '',
    scheduleRepeat: 'none',
  });

  const [newShift, setNewShift] = useState(buildEmptyShiftForm);

  useEffect(() => {
    initializeScheduling();
  }, []);

  useEffect(() => {
    // Reload shifts when date changes
    if (selectedDate) {
      loadShifts();
      loadUnassignedShifts();
    }
  }, [selectedDate]);

  const initializeScheduling = async () => {
    try {
      setActionLoading(true);
      await Promise.all([
        loadShifts(),
        loadUnassignedShifts(),
        loadGuards(),
        loadSites(),
      ]);
      
      console.log('📅 Shift Scheduling initialized');
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_scheduling');
    } finally {
      setActionLoading(false);
    }
  };

  const loadUnassignedShifts = async () => {
    try {
      const response = await shiftApi.getUnassignedShifts(selectedDate);
      
      if (response.success && response.data) {
        const transformedShifts: ScheduledShift[] = (response.data as any[]).map((shift: any) => {
          const site = shift.site;
          const siteName = site?.name || shift.locationName || 'Unknown Site';
          const siteId = site?.id || shift.siteId || '';

          const startDate = new Date(shift.scheduledStartTime);
          const endDate = new Date(shift.scheduledEndTime);
          const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
          const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
          
          let status: ScheduledShift['status'] = 'scheduled';
          if (shift.status === 'IN_PROGRESS') status = 'in_progress';
          else if (shift.status === 'COMPLETED') status = 'completed';
          else if (shift.status === 'CANCELLED') status = 'cancelled';

          // Determine if shift was created by client
          const clientName = shift.client?.user 
            ? `${shift.client.user.firstName || ''} ${shift.client.user.lastName || ''}`.trim() || shift.client.user.email
            : null;

          return {
            id: shift.id,
            guardId: null,
            guardName: 'Unassigned',
            siteId,
            siteName,
            startTime,
            endTime,
            date: selectedDate,
            status,
            shiftType: 'regular' as ScheduledShift['shiftType'],
            notes: shift.notes,
            clientName: clientName || undefined,
            isClientCreated: !!shift.client,
          };
        });

        setUnassignedShifts(transformedShifts);
      } else {
        setUnassignedShifts([]);
      }
    } catch (error) {
      console.error('Error loading unassigned shifts:', error);
      setUnassignedShifts([]);
    }
  };

  const loadShifts = async () => {
    await reloadShifts();
  };

  const loadGuards = async () => {
    try {
      const response = await adminApi.getGuards(1, 50);
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
      const response = await adminApi.getAdminSites();
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
    const availability = guard.availability[shiftData.startDate];
    if (!availability?.available) {
      conflicts.push({
        type: 'guard_unavailable',
        message: `Guard is not available on ${shiftData.startDate}${availability?.reason ? `: ${availability.reason}` : ''}`,
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
      s.date === shiftData.startDate &&
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
    
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10;
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

  const openCreateShiftModal = () => {
    setNewShift(buildEmptyShiftForm(selectedDate));
    setShowCreateModal(true);
  };

  const handleNewShiftFormChange = <K extends keyof ShiftFormValues>(
    field: K,
    value: ShiftFormValues[K],
  ) => {
    setNewShift((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateShift = async () => {
    const validation = validateShiftSchedule(
      newShift.startDate,
      newShift.startTime,
      newShift.endDate,
      newShift.endTime,
    );
    if (!validation.valid) {
      Alert.alert('Error', validation.message);
      return;
    }

    const site = sites.find((s) => s.id === newShift.siteId);
    if (!site) {
      Alert.alert('Error', 'Please select a site');
      return;
    }

    try {
      setActionLoading(true);
      const conflicts = newShift.guardId ? detectConflicts(newShift) : [];
      const hasErrors = conflicts.some((c) => c.severity === 'error');

      if (hasErrors) {
        Alert.alert(
          'Scheduling Conflicts',
          conflicts.filter((c) => c.severity === 'error').map((c) => c.message).join('\n'),
          [{ text: 'OK' }],
        );
        return;
      }

      const scheduledStartTime = combineDateTime(newShift.startDate, newShift.startTime);
      const scheduledEndTime = combineDateTime(newShift.endDate, newShift.endTime);
      const description = newShift.description.trim() || undefined;
      const notes = newShift.notes.trim() || undefined;

      const apiResponse =
        newShift.scheduleRepeat === 'week' || newShift.scheduleRepeat === 'month'
          ? await shiftApi.createAdminBulkShifts({
              guardId: newShift.guardId || undefined,
              siteId: site.id,
              scheduledStartTime,
              scheduledEndTime,
              description,
              notes,
              repeatPattern: newShift.scheduleRepeat,
            })
          : await shiftApi.createAdminShift({
              guardId: newShift.guardId || undefined,
              siteId: site.id,
              locationName: site.name,
              locationAddress: site.address,
              scheduledStartTime,
              scheduledEndTime,
              description,
              notes,
            });

      if (!apiResponse.success) {
        showSchedulingErrorAlert(apiResponse.message || 'Failed to create shift');
        return;
      }

      await Promise.all([loadShifts(), loadUnassignedShifts()]);
      setShowCreateModal(false);
      setNewShift(buildEmptyShiftForm(selectedDate));

      const baseMessage = getRepeatSuccessMessage(newShift.scheduleRepeat);
      const detailMessage = newShift.guardId
        ? conflicts.length > 0
          ? `${baseMessage} (${conflicts.length} warning(s))`
          : baseMessage
        : `${baseMessage} Assign a guard from the Unassigned tab if needed.`;

      Alert.alert('Shift Created', detailMessage);
    } catch (error) {
      ErrorHandler.handleError(error, 'create_shift', false);
      showShiftActionError('Create Shift', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignGuard = async (shiftId: string, guardId: string) => {
    try {
      setActionLoading(true);
      const response = await shiftApi.assignGuardToShift(shiftId, guardId);

      if (response.success) {
        Alert.alert('Success', 'Guard assigned to shift successfully');
        // Reload both lists
        await Promise.all([loadShifts(), loadUnassignedShifts()]);
        setShowAssignGuardModal(false);
        setSelectedShiftForAssignment(null);
      } else {
        showSchedulingErrorAlert(response.message || 'Failed to assign guard');
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'assign_guard', false);
      showShiftActionError('Assign Guard', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openAssignGuardModal = (shift: ScheduledShift) => {
    setSelectedShiftForAssignment(shift);
    setShowAssignGuardModal(true);
  };

  const openEditModal = (shift: ScheduledShift) => {
    setEditingShift(shift);
    setEditForm({
      startTime: shift.startTime,
      endTime: shift.endTime,
      notes: shift.notes || '',
    });
    setShowEditModal(true);
  };

  const handleEditShift = async () => {
    if (!editingShift) return;

    const validation = validateShiftSchedule(
      editingShift.date,
      editForm.startTime,
      editingShift.date,
      editForm.endTime,
    );
    if (!validation.valid) {
      Alert.alert('Error', validation.message);
      return;
    }

    try {
      setActionLoading(true);
      const scheduledStartTime = combineDateTime(editingShift.date, editForm.startTime);
      const scheduledEndTime = combineDateTime(editingShift.date, editForm.endTime);

      const response = await shiftApi.updateAdminShift(editingShift.id, {
        scheduledStartTime,
        scheduledEndTime,
        notes: editForm.notes.trim() || undefined,
      });

      if (response.success) {
        await Promise.all([loadShifts(), loadUnassignedShifts()]);
        setShowEditModal(false);
        setEditingShift(null);
        Alert.alert('Success', 'Shift updated successfully');
      } else {
        showSchedulingErrorAlert(response.message || 'Failed to update shift');
      }
    } catch (error) {
      showShiftActionError('Update Shift', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShift = (shift: ScheduledShift) => {
    Alert.alert(
      'Delete Shift',
      `Are you sure you want to delete the shift at ${shift.siteName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await shiftApi.deleteAdminShift(shift.id);
              if (response.success) {
                await Promise.all([loadShifts(), loadUnassignedShifts()]);
                Alert.alert('Deleted', 'Shift deleted successfully');
              } else {
                showShiftActionError('Delete Shift', response.message || 'Failed to delete shift');
              }
            } catch (error) {
              showShiftActionError('Delete Shift', error);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (item: ScheduledShift) => {
    navigation.navigate('ShiftDetails', { shiftId: item.id });
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

  const renderAssignGuardButton = (shift: ScheduledShift) => (
    <TouchableOpacity
      style={styles.assignGuardButton}
      onPress={() => openAssignGuardModal(shift)}
    >
      <UserIcon size={14} color={COLORS.primary} />
      <Text style={styles.assignGuardButtonText}>Assign Guard</Text>
    </TouchableOpacity>
  );

  const renderShiftCardActions = (shift: ScheduledShift) => (
    <View style={styles.shiftActionsRow}>
      <TouchableOpacity
        style={styles.cardActionBtn}
        onPress={() => handleViewDetails(shift)}
      >
        <InfoIcon size={14} color={COLORS.primary} />
        <Text style={styles.cardActionBtnText}>Details</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cardActionBtn}
        onPress={() => openEditModal(shift)}
      >
        <EditIcon size={14} color={COLORS.primary} />
        <Text style={styles.cardActionBtnText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.cardActionBtn, styles.cardActionBtnDanger]}
        onPress={() => handleDeleteShift(shift)}
      >
        <TrashIcon size={14} color={COLORS.error} />
        <Text style={[styles.cardActionBtnText, styles.cardActionBtnTextDanger]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

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
          disabled={isBusy}
        >
          <ArrowLeftIcon size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
        
        <View style={styles.dateTextContainer}>
          {shiftsLoading && (
            <RefreshCwIcon size={16} color={COLORS.primary} style={{ marginRight: SPACING.xs }} />
          )}
          <Text style={styles.selectedDate}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            setSelectedDate(nextDate.toISOString().split('T')[0]);
          }}
          disabled={isBusy}
        >
          <ArrowRightIcon size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={shifts.filter(s => s.date === selectedDate)}
        renderItem={({ item }) => (
          <View style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.shiftGuard}>
                  {item.guardName || 'Unassigned'}
                </Text>
                <View style={styles.badgeRow}>
                  {!item.guardId && (
                    <View style={styles.unassignedBadge}>
                      <Text style={styles.unassignedBadgeText}>NEEDS GUARD</Text>
                    </View>
                  )}
                  {item.isClientCreated && (
                    <View style={styles.clientCreatedBadge}>
                      <Text style={styles.clientCreatedBadgeText}>
                        Created by {item.clientName || 'Client'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            
            {!item.guardId && renderAssignGuardButton(item)}
            
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
            
            {renderShiftCardActions(item)}
          </View>
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ShiftsIcon size={64} color={COLORS.textSecondary} style={{ marginBottom: SPACING.md }} />
            <Text style={styles.emptyStateText}>No shifts scheduled for this date</Text>
            <Text style={styles.emptyStateSubtext}>Tap the + button below to create a new shift</Text>
          </View>
        }
        refreshing={shiftsLoading}
        onRefresh={loadShifts}
      />
    </View>
  );

  const renderUnassignedView = () => (
    <View style={styles.calendarContainer}>
      <View style={styles.dateSelector}>
        <View style={styles.dateTextContainer}>
          {shiftsLoading && (
            <RefreshCwIcon size={16} color={COLORS.primary} style={{ marginRight: SPACING.xs }} />
          )}
          <Text style={styles.selectedDate}>
            Unassigned Shifts - {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>

      <FlatList
        data={unassignedShifts.filter(s => s.date === selectedDate)}
        renderItem={({ item }) => (
          <View style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.shiftGuard}>Unassigned</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.unassignedBadge}>
                    <Text style={styles.unassignedBadgeText}>NEEDS GUARD</Text>
                  </View>
                  {item.isClientCreated && (
                    <View style={styles.clientCreatedBadge}>
                      <Text style={styles.clientCreatedBadgeText}>
                        Created by {item.clientName || 'Client'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
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
            
            {renderAssignGuardButton(item)}
            {renderShiftCardActions(item)}
          </View>
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CheckCircleIcon size={64} color={COLORS.success} style={{ marginBottom: SPACING.md }} />
            <Text style={styles.emptyStateText}>No unassigned shifts</Text>
            <Text style={styles.emptyStateSubtext}>All shifts have guards assigned</Text>
          </View>
        }
        refreshing={shiftsLoading}
        onRefresh={() => loadUnassignedShifts()}
      />
    </View>
  );

  const renderAssignGuardModal = () => {
    if (!selectedShiftForAssignment) return null;

    return (
      <Modal
        visible={showAssignGuardModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Guard to Shift</Text>
            <TouchableOpacity onPress={() => {
              setShowAssignGuardModal(false);
              setSelectedShiftForAssignment(null);
              setSelectedGuardIdForAssignment('');
            }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Shift Details</Text>
              <View style={styles.shiftInfoCard}>
                <Text style={styles.shiftInfoLabel}>Site:</Text>
                <Text style={styles.shiftInfoValue}>{selectedShiftForAssignment.siteName}</Text>
                <Text style={styles.shiftInfoLabel}>Time:</Text>
                <Text style={styles.shiftInfoValue}>
                  {selectedShiftForAssignment.startTime} - {selectedShiftForAssignment.endTime}
                </Text>
                <Text style={styles.shiftInfoLabel}>Date:</Text>
                <Text style={styles.shiftInfoValue}>
                  {new Date(selectedShiftForAssignment.date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.formLabelContainer}>
                <UserIcon size={18} color={COLORS.primary} style={{ marginRight: SPACING.xs }} />
                <Text style={styles.formLabel}>Select Guard *</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {guards.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionItem,
                      selectedGuardIdForAssignment === item.id && styles.optionItemSelected,
                    ]}
                    onPress={() => setSelectedGuardIdForAssignment(item.id)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedGuardIdForAssignment === item.id && styles.optionTextSelected,
                    ]}>{item.name}</Text>
                    <Text style={[
                      styles.optionSubtext,
                      selectedGuardIdForAssignment === item.id && styles.optionSubtextSelected,
                    ]}>
                      {item.currentWeekHours}/{item.maxHoursPerWeek}h this week
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.createButton, (!selectedGuardIdForAssignment || actionLoading) && styles.createButtonDisabled]}
              onPress={() => {
                if (selectedGuardIdForAssignment && selectedShiftForAssignment) {
                  handleAssignGuard(selectedShiftForAssignment.id, selectedGuardIdForAssignment);
                }
              }}
              disabled={!selectedGuardIdForAssignment || actionLoading}
            >
              {actionLoading ? (
                <RefreshCwIcon size={20} color={COLORS.textInverse} style={{ marginRight: SPACING.xs }} />
              ) : (
                <CheckCircleIcon size={20} color={COLORS.textInverse} style={{ marginRight: SPACING.xs }} />
              )}
              <Text style={styles.createButtonText}>
                {actionLoading ? 'Assigning...' : 'Assign Guard'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderEditModal = () => {
    if (!editingShift) return null;

    return (
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingShift(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Shift</Text>
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                setEditingShift(null);
              }}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentInner}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Shift Details</Text>
              <View style={styles.shiftInfoCard}>
                <Text style={styles.shiftInfoLabel}>Site</Text>
                <Text style={styles.shiftInfoValue}>{editingShift.siteName}</Text>
                <Text style={styles.shiftInfoLabel}>Guard</Text>
                <Text style={styles.shiftInfoValue}>
                  {editingShift.guardName || 'Unassigned'}
                </Text>
                <Text style={styles.shiftInfoLabel}>Date</Text>
                <Text style={styles.shiftInfoValue}>
                  {new Date(editingShift.date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.timeSection}>
              <FormInput
                label="Start Time"
                value={editForm.startTime}
                onChangeText={(value) => setEditForm((prev) => ({ ...prev, startTime: value }))}
                placeholder="09:00"
                containerStyle={styles.timeInput}
              />

              <FormInput
                label="End Time"
                value={editForm.endTime}
                onChangeText={(value) => setEditForm((prev) => ({ ...prev, endTime: value }))}
                placeholder="17:00"
                containerStyle={styles.timeInput}
              />
            </View>

            <FormInput
              label="Notes"
              value={editForm.notes}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, notes: value }))}
              placeholder="Optional shift notes"
              multiline
              numberOfLines={3}
              containerStyle={styles.formSection}
            />

            <TouchableOpacity
              style={[styles.createButton, actionLoading && styles.createButtonDisabled]}
              onPress={handleEditShift}
              disabled={isBusy}
            >
              {actionLoading ? (
                <RefreshCwIcon size={20} color={COLORS.textInverse} style={{ marginRight: SPACING.xs }} />
              ) : (
                <CheckCircleIcon size={20} color={COLORS.textInverse} style={{ marginRight: SPACING.xs }} />
              )}
              <Text style={styles.createButtonText}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderCreateShiftModal = () => {
    const guardOptions = guards.map((guard) => ({
      id: guard.id,
      label: guard.name,
      sublabel: `${guard.currentWeekHours}/${guard.maxHoursPerWeek}h this week`,
    }));

    const siteOptions = sites.map((site) => ({
      id: site.id,
      label: site.name,
      sublabel: site.address,
    }));

    const conflicts = newShift.guardId && newShift.siteId ? detectConflicts(newShift) : [];

    return (
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Shift</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentInner}
            keyboardShouldPersistTaps="handled"
          >
            <SectionHeader title="Assignment" subtitle="Pick site and optionally assign a guard" />

            <View style={styles.createFormCard}>
              <ShiftOptionPicker
                label="Site"
                placeholder="Select site"
                options={siteOptions}
                selectedId={newShift.siteId}
                onSelect={(id) => setNewShift((prev) => ({ ...prev, siteId: id || '' }))}
                required
              />
              <ShiftOptionPicker
                label="Guard"
                placeholder="Select guard (optional)"
                options={guardOptions}
                selectedId={newShift.guardId}
                onSelect={(id) => setNewShift((prev) => ({ ...prev, guardId: id || '' }))}
                allowNone
                noneLabel="No guard yet"
                noneSublabel="Assign later from Unassigned tab"
              />
            </View>

            <ShiftFormFields values={newShift} onChange={handleNewShiftFormChange} />

            {newShift.guardId && newShift.siteId ? (
              <View style={styles.conflictPreview}>
                <View style={styles.formLabelContainer}>
                  <InfoIcon size={18} color={COLORS.info} style={{ marginRight: SPACING.xs }} />
                  <Text style={styles.conflictPreviewTitle}>Conflict check</Text>
                </View>
                {conflicts.length === 0 ? (
                  <View style={styles.conflictItem}>
                    <CheckCircleIcon size={16} color={COLORS.success} style={{ marginRight: SPACING.xs }} />
                    <Text style={[styles.conflictPreviewText, { color: COLORS.success }]}>
                      No conflicts detected
                    </Text>
                  </View>
                ) : (
                  conflicts.map((conflict, index) => (
                    <View key={index} style={styles.conflictItem}>
                      <AlertTriangleIcon
                        size={16}
                        color={conflict.severity === 'error' ? COLORS.error : COLORS.warning}
                        style={{ marginRight: SPACING.xs }}
                      />
                      <Text
                        style={[
                          styles.conflictPreviewText,
                          { color: conflict.severity === 'error' ? COLORS.error : COLORS.warning },
                        ]}
                      >
                        {conflict.message}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.createButton, actionLoading && styles.createButtonDisabled]}
              onPress={handleCreateShift}
              disabled={isBusy}
            >
              {actionLoading ? (
                <RefreshCwIcon size={20} color={COLORS.textInverse} style={{ marginRight: SPACING.xs }} />
              ) : (
                <PlusIcon size={20} color={COLORS.textInverse} style={{ marginRight: SPACING.xs }} />
              )}
              <Text style={styles.createButtonText}>
                {actionLoading ? 'Creating...' : 'Create Shift'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Shift Scheduling"
        onMenuPress={openDrawer}
        onNotificationPress={() => {
          navigation.navigate('AdminNotifications' as never);
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
          },
          { 
            key: 'conflicts', 
            label: 'Conflicts', 
            icon: EmergencyIcon,
          },
          { 
            key: 'guards', 
            label: 'Guards', 
            icon: UserIcon,
          },
          { 
            key: 'unassigned', 
            label: `Unassigned${unassignedShifts.length > 0 ? ` (${unassignedShifts.length})` : ''}`, 
            icon: AlertTriangleIcon,
          },
        ].map((view) => {
          const isActive = selectedView === view.key;
          const IconComponent = view.icon;
          const iconColor = isActive ? COLORS.textInverse : COLORS.primary;
          return (
            <TouchableOpacity
              key={view.key}
              style={[
                styles.viewTab,
                isActive && styles.viewTabActive,
              ]}
              onPress={() => setSelectedView(view.key as any)}
            >
              <IconComponent size={20} color={iconColor} style={{ marginBottom: SPACING.xs }} />
              <Text style={[
                styles.viewTabText,
                isActive && styles.viewTabTextActive,
                { textAlign: 'center' }
              ]}>
                {view.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

        {selectedView === 'calendar' && renderCalendarView()}
        {selectedView === 'unassigned' && renderUnassignedView()}
        
        {renderCreateShiftModal()}
        {renderAssignGuardModal()}
        {renderEditModal()}
      </View>

      {/* Sticky Action Button */}
      <TouchableOpacity 
        style={[
          styles.stickyAddButton,
          { bottom: Math.max(insets.bottom + SPACING.md, SPACING.lg) },
        ]}
        onPress={openCreateShiftModal}
      >
        <PlusIcon size={18} color={COLORS.textInverse} style={{ marginRight: SPACING.xs }} />
        <Text style={styles.stickyAddButtonText}>Add Shift</Text>
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
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  viewTabActive: {
    backgroundColor: COLORS.primary,
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
  dateTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
  shiftActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.backgroundSecondary,
    gap: SPACING.xs / 2,
  },
  cardActionBtnDanger: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  cardActionBtnText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  cardActionBtnTextDanger: {
    color: COLORS.error,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  modalContentInner: {
    paddingBottom: SPACING.xxxxl,
  },
  createFormCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  formLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  horizontalScroll: {
    marginVertical: SPACING.xs,
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
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  timeField: {
    flex: 1,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  notesField: {
    minHeight: 88,
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
  conflictItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  conflictPreviewText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    flex: 1,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  unassignedBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  unassignedBadgeText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  assignGuardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    gap: SPACING.xs / 2,
  },
  assignGuardButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  shiftInfoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  shiftInfoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs / 2,
  },
  shiftInfoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  clientCreatedBadge: {
    backgroundColor: COLORS.info,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  clientCreatedBadgeText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default ShiftSchedulingScreen;
