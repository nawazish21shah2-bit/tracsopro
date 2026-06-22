import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import ScreenBackHeader from '../../components/common/ScreenBackHeader';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';
import { EmergencyIcon } from '../../components/ui/AppIcons';
import { formatTimeAgo } from '../../components/emergency/EmergencyAlertsPanel';
import operationsService, { EmergencyAlert } from '../../services/operationsService';
import { isPendingEmergencyAlert } from '../../utils/emergencyAlertUtils';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

type EmergencyAlertResponseRouteParams = {
  EmergencyAlertResponse: { alertId: string };
};

const EmergencyAlertResponseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EmergencyAlertResponseRouteParams, 'EmergencyAlertResponse'>>();
  const { alertId } = route.params;

  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [resolving, setResolving] = useState(false);

  const loadAlert = useCallback(async () => {
    setLoading(true);
    try {
      const alerts = await operationsService.getActiveEmergencyAlerts();
      const match = alerts.find((item) => item.id === alertId);
      setAlert(match || null);
    } catch (error) {
      console.error('Error loading emergency alert:', error);
      setAlert(null);
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    loadAlert();
  }, [loadAlert]);

  const handleDispatch = () => {
    Alert.alert(
      'Dispatch Response',
      'Confirm you are dispatching assistance for this emergency?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch',
          style: 'destructive',
          onPress: async () => {
            setDispatching(true);
            try {
              const result = await operationsService.acknowledgeEmergencyAlert(alertId);
              if (result.success) {
                Alert.alert('Dispatched', 'Emergency response has been dispatched.');
                await loadAlert();
              } else {
                Alert.alert('Error', result.message || 'Failed to dispatch response.');
              }
            } finally {
              setDispatching(false);
            }
          },
        },
      ],
    );
  };

  const handleResolve = (status: 'RESOLVED' | 'FALSE_ALARM') => {
    const notes = resolutionNotes.trim();
    if (!notes) {
      Alert.alert('Notes Required', 'Please describe how this emergency was handled.');
      return;
    }

    const title = status === 'FALSE_ALARM' ? 'Mark False Alarm' : 'Resolve Emergency';
    const message =
      status === 'FALSE_ALARM'
        ? 'Confirm this was a false alarm?'
        : 'Confirm this emergency has been fully resolved?';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setResolving(true);
          try {
            const result = await operationsService.resolveEmergencyAlert(alertId, notes, status);
            if (result.success) {
              Alert.alert('Closed', 'Emergency alert has been closed.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } else {
              Alert.alert('Error', result.message || 'Failed to resolve emergency alert.');
            }
          } finally {
            setResolving(false);
          }
        },
      },
    ]);
  };

  const pending = alert ? isPendingEmergencyAlert(alert) : false;
  const timestamp = alert?.timestamp || Date.now();

  return (
    <SafeAreaWrapper>
      <ScreenBackHeader title="Emergency Response" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.error} />
          <Text style={styles.loadingText}>Loading emergency details...</Text>
        </View>
      ) : !alert ? (
        <View style={styles.centered}>
          <EmergencyIcon size={40} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>Alert unavailable</Text>
          <Text style={styles.emptySubtitle}>
            This emergency may already be resolved or is no longer active.
          </Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} style={styles.backButton} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <EmergencyIcon size={28} color={COLORS.error} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>{alert.guardName || 'Guard'}</Text>
              <Text style={styles.heroSubtitle}>
                {(alert.type || 'Emergency').replace(/_/g, ' ')} ·{' '}
                {(alert.severity || 'critical').toUpperCase()}
              </Text>
              <Text style={styles.heroTime}>{formatTimeAgo(timestamp)}</Text>
            </View>
            <View style={[styles.statusPill, pending ? styles.statusPending : styles.statusActive]}>
              <Text style={styles.statusText}>{pending ? 'NEEDS DISPATCH' : 'IN PROGRESS'}</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.sectionLabel}>Alert message</Text>
            <Text style={styles.messageText}>
              {alert.message || 'Emergency alert triggered by guard.'}
            </Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.sectionLabel}>Response notes</Text>
            <FormInput
              label=""
              placeholder="Describe actions taken, responders contacted, and outcome..."
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
            />
          </View>

          <View style={styles.actions}>
            {pending ? (
              <Button
                title={dispatching ? 'Dispatching...' : 'Dispatch Assistance'}
                onPress={handleDispatch}
                disabled={dispatching || resolving}
                variant="danger"
                fullWidth
                style={styles.actionButton}
              />
            ) : null}

            <Button
              title={resolving ? 'Closing...' : 'Mark Resolved'}
              onPress={() => handleResolve('RESOLVED')}
              disabled={dispatching || resolving}
              variant="success"
              fullWidth
              style={styles.actionButton}
            />

            <Button
              title="False Alarm"
              onPress={() => handleResolve('FALSE_ALARM')}
              disabled={dispatching || resolving}
              variant="warning"
              fullWidth
              style={styles.actionButton}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  contentInner: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    marginTop: SPACING.md,
    minWidth: 140,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.error + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  heroSubtitle: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  heroTime: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  statusPending: {
    backgroundColor: COLORS.error + '18',
  },
  statusActive: {
    backgroundColor: COLORS.warning + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.error,
    letterSpacing: 0.4,
  },
  detailCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  messageText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    width: '100%',
  },
});

export default EmergencyAlertResponseScreen;
