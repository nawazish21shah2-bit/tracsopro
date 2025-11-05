import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import ClientAppHeader from '../../components/ui/ClientAppHeader';

const TestHamburgerScreen: React.FC = () => {
  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'Notification pressed');
  };

  const handleNavigateToProfile = () => {
    Alert.alert('Profile', 'Navigate to profile');
  };

  const handleNavigateToSites = () => {
    Alert.alert('Sites', 'Navigate to sites');
  };

  const handleNavigateToGuards = () => {
    Alert.alert('Guards', 'Navigate to guards');
  };

  const handleNavigateToReports = () => {
    Alert.alert('Reports', 'Navigate to reports');
  };

  const handleNavigateToAnalytics = () => {
    Alert.alert('Analytics', 'Navigate to analytics');
  };

  const handleNavigateToNotifications = () => {
    Alert.alert('Notification Settings', 'Navigate to notification settings');
  };

  const handleNavigateToSupport = () => {
    Alert.alert('Support', 'Navigate to support');
  };

  return (
    <SafeAreaWrapper>
      <ClientAppHeader
        title="Test Hamburger"
        onNotificationPress={handleNotificationPress}
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToSites={handleNavigateToSites}
        onNavigateToGuards={handleNavigateToGuards}
        onNavigateToReports={handleNavigateToReports}
        onNavigateToAnalytics={handleNavigateToAnalytics}
        onNavigateToNotifications={handleNavigateToNotifications}
        onNavigateToSupport={handleNavigateToSupport}
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>Test Hamburger Menu</Text>
        <Text style={styles.subtitle}>
          Tap the hamburger menu (☰) in the top-left corner to open the drawer.
        </Text>
        <Text style={styles.instructions}>
          You should see console logs when:
          {'\n'}• Hamburger button is pressed
          {'\n'}• Drawer visibility state changes
          {'\n'}• Drawer component receives visibility prop
        </Text>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructions: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'left',
    lineHeight: 20,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1C6CA9',
  },
});

export default TestHamburgerScreen;
