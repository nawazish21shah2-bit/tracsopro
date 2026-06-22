import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { AppDispatch } from '../../store';
import { startImpersonation } from '../../store/slices/authSlice';
import { superAdminService } from '../../services/superAdminService';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import BackNavButton from '../../components/common/BackNavButton';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';
import FormInput from '../../components/common/FormInput';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const ImpersonateUserScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadUsers = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const result = await superAdminService.searchUsers({
        search: query || undefined,
        page: 1,
        limit: 30,
      });
      setUsers(result.users);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search, loadUsers]);

  const handleImpersonate = (user: UserRow) => {
    Alert.alert(
      'Impersonate User',
      `Sign in as ${user.firstName} ${user.lastName} (${user.role})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Impersonate',
          onPress: async () => {
            try {
              setProcessingId(user.id);
              await dispatch(startImpersonation(user.id)).unwrap();
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to impersonate user');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: UserRow }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleImpersonate(item)}
      disabled={processingId === item.id}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{item.role}</Text>
      </View>
      {processingId === item.id && (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper>
      <SharedHeader variant="superAdmin" title="Impersonate User" />
      <BackNavButton
        style={styles.backRow}
        onPress={() => navigation.goBack()}
      />
      <View style={styles.searchContainer}>
        <FormInput
          icon="search"
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email..."
          autoCapitalize="none"
        />
      </View>
      {loading && users.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{loading ? 'Searching...' : 'No users found'}</Text>
          }
        />
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  backRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
  },
  searchInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxxxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPrimary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  loader: { marginLeft: SPACING.sm },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    padding: SPACING.xl,
  },
});

export default ImpersonateUserScreen;
