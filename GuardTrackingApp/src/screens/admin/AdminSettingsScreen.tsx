/**
 * Admin Settings Screen - System configuration and admin preferences
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { SettingsIcon, UserIcon, NotificationIcon, DollarIcon } from '../../components/ui/AppIcons';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';

const AdminSettingsScreen: React.FC<{ navigation?: any }> = ({ navigation: propNavigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation() || propNavigation;

  const settingsOptions = [
    { id: 'profile', title: 'Admin Profile', subtitle: 'Manage admin account', icon: UserIcon },
    { id: 'subscription', title: 'Subscription & Billing', subtitle: 'Manage platform subscription', icon: DollarIcon },
    { id: 'notifications', title: 'Notifications', subtitle: 'Configure alerts', icon: NotificationIcon },
    { id: 'system', title: 'System Settings', subtitle: 'App configuration', icon: SettingsIcon },
  ];

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {settingsOptions.map((option) => (
          <TouchableOpacity 
            key={option.id} 
            style={styles.settingItem}
            onPress={() => {
              if (option.id === 'subscription') {
                navigation.navigate('AdminSubscription' as never);
              }
            }}
          >
            <option.icon size={24} color={COLORS.primary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{option.title}</Text>
              <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.settingItem, styles.logoutItem]} onPress={handleLogout}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, styles.logoutText]}>Logout</Text>
            <Text style={[styles.settingSubtitle, styles.logoutText]}>Sign out of your admin account</Text>
          </View>
          <Text style={[styles.arrow, styles.logoutText]}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.primary },
  backButton: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.md, marginRight: SPACING.md },
  headerTitle: { color: COLORS.textInverse, fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold },
  content: { flex: 1, padding: SPACING.md },
  settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundSecondary, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm },
  settingContent: { flex: 1, marginLeft: SPACING.md },
  settingTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.textPrimary },
  settingSubtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  arrow: { fontSize: TYPOGRAPHY.fontSize.lg, color: COLORS.textSecondary },
  logoutItem: { backgroundColor: '#FEE2E2' },
  logoutText: { color: COLORS.error },
});

export default AdminSettingsScreen;
