import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/client/StatusBadge';
import { clientApi } from '../../services/api/clientApi';
import { getClientGuardChatParams } from '../../utils/chatHelper';
import { parseDisplayName } from '../../utils/parseDisplayName';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { MapPinIcon, ClockIcon, CalendarIcon, FeatherIcon } from '../../components/ui/FeatherIcons';

export type ClientGuardDetailsParams = {
  guardId: string;
  guardName?: string;
  userId?: string;
  avatar?: string;
  shiftId?: string;
};

interface GuardProfile {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  experience?: string;
  status: 'Active' | 'Upcoming' | 'Missed' | 'Completed' | 'Offline';
  currentSite?: string;
  currentSiteAddress?: string;
  shiftId?: string;
  shiftTime?: string;
  checkInTime?: string;
  stats?: {
    completedShifts: number;
    totalShifts: number;
    rating: number;
  };
  qualifications?: Array<{ title: string; issuer: string; expiryDate?: string }>;
}

const ClientGuardDetailsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const route = useRoute<any>();
  const params = route.params as ClientGuardDetailsParams;
  const { user } = useSelector((state: RootState) => state.auth);

  const [profile, setProfile] = useState<GuardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clientApi.getClientGuardProfile(params.guardId);
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        Alert.alert('Error', response.message || 'Could not load guard profile', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load guard profile', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [params.guardId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleChat = () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in again');
      return;
    }
    const guardUserId = profile?.userId || params.userId;
    if (!guardUserId) {
      Alert.alert('Error', 'Unable to open chat for this guard');
      return;
    }
    const chatParams = getClientGuardChatParams(
      user.id,
      guardUserId,
      profile?.name || params.guardName || 'Guard',
      profile?.avatar || params.avatar,
      'general',
    );
    navigation.navigate('IndividualChatScreen', chatParams);
  };

  const handleCall = () => {
    const phone = profile?.phone;
    if (!phone) {
      Alert.alert('Unavailable', 'No phone number on file for this guard.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  };

  const handleViewShift = () => {
    const shiftId = profile?.shiftId || params.shiftId;
    if (shiftId) {
      navigation.navigate('ShiftDetails', { shiftId });
    }
  };

  const displayName = profile?.name || params.guardName || 'Guard';
  const { firstName, lastName } = parseDisplayName(displayName);
  const statusForBadge =
    profile?.status === 'Offline'
      ? 'Completed'
      : (profile?.status as 'Active' | 'Upcoming' | 'Missed' | 'Completed') || 'Upcoming';

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader variant="client" title="Guard Profile" showLogo={false} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaWrapper>
      <SharedHeader variant="client" title="Guard Profile" showLogo={false} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroAccent} />
          <View style={styles.heroBody}>
            <ProfileAvatar
              firstName={firstName}
              lastName={lastName}
              profilePictureUrl={profile.avatar}
              size={72}
            />
            <Text style={styles.name}>{displayName}</Text>
            {profile.experience ? (
              <Text style={styles.experience}>{profile.experience}</Text>
            ) : null}
            <View style={styles.statusRow}>
              <StatusBadge status={statusForBadge} size="small" />
              {profile.stats?.rating ? (
                <View style={styles.ratingPill}>
                  <FeatherIcon name="star" size={13} color={COLORS.primary} />
                  <Text style={styles.ratingText}>{profile.stats.rating.toFixed(1)} rating</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleChat} activeOpacity={0.85}>
            <FeatherIcon name="messageCircle" size={18} color={COLORS.textInverse} />
            <Text style={styles.primaryActionText}>Message</Text>
          </TouchableOpacity>
          {profile.phone ? (
            <TouchableOpacity style={styles.secondaryAction} onPress={handleCall} activeOpacity={0.85}>
              <FeatherIcon name="phone" size={18} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>Call</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.stats?.totalShifts ?? 0}</Text>
            <Text style={styles.statLabel}>Total Shifts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.stats?.completedShifts ?? 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.stats?.rating?.toFixed(1) ?? '—'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <SectionHeader title="Current Assignment" subtitle="Site and shift details" />

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MapPinIcon size={18} color={COLORS.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Site</Text>
              <Text style={styles.infoValue}>{profile.currentSite || 'Not assigned'}</Text>
              {profile.currentSiteAddress ? (
                <Text style={styles.infoSub}>{profile.currentSiteAddress}</Text>
              ) : null}
            </View>
          </View>

          {profile.shiftTime ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <ClockIcon size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Shift Time</Text>
                <Text style={styles.infoValue}>{profile.shiftTime}</Text>
                {profile.checkInTime ? (
                  <Text style={styles.checkInText}>
                    Checked in {new Date(profile.checkInTime).toLocaleTimeString()}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {profile.shiftId ? (
            <TouchableOpacity style={styles.shiftLink} onPress={handleViewShift}>
              <CalendarIcon size={16} color={COLORS.primary} />
              <Text style={styles.shiftLinkText}>View shift details</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <SectionHeader title="Contact" />

        <View style={styles.infoCard}>
          {profile.email ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <FeatherIcon name="mail" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
            </View>
          ) : null}
          {profile.phone ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <FeatherIcon name="phone" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profile.phone}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {profile.qualifications && profile.qualifications.length > 0 ? (
          <>
            <SectionHeader title="Certifications" />
            <View style={styles.infoCard}>
              {profile.qualifications.map((q, index) => (
                <View
                  key={`${q.title}-${index}`}
                  style={[styles.qualRow, index > 0 && styles.qualBorder]}
                >
                  <Text style={styles.qualTitle}>{q.title}</Text>
                  <Text style={styles.qualIssuer}>{q.issuer}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  heroAccent: {
    height: 4,
    backgroundColor: COLORS.primary,
  },
  heroBody: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  experience: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.secondary,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primaryDark,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  primaryActionText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  statLabel: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    textAlign: 'center',
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginTop: 2,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  infoSub: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  checkInText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    marginTop: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  shiftLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  shiftLinkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  qualRow: {
    paddingVertical: SPACING.sm,
  },
  qualBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  qualTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  qualIssuer: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default ClientGuardDetailsScreen;
