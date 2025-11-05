import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ViewStyle, ImageStyle } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Bell, Menu, Home } from 'react-native-feather';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';
import Logo from '../../assets/images/tracSOpro-logo.png';
import ClientProfileDrawer from '../client/ClientProfileDrawer';
import SimpleTestDrawer from '../client/SimpleTestDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

interface ClientAppHeaderProps {
  title?: string;
  showLogo?: boolean;
  onNotificationPress?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSites?: () => void;
  onNavigateToGuards?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToSupport?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const ClientAppHeader: React.FC<ClientAppHeaderProps> = ({
  title,
  showLogo = false,
  onNotificationPress,
  onNavigateToProfile,
  onNavigateToSites,
  onNavigateToGuards,
  onNavigateToReports,
  onNavigateToAnalytics,
  onNavigateToNotifications,
  onNavigateToSupport,
  leftIcon,
  rightIcon,
  style,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  
  console.log('ClientAppHeader - isDrawerVisible:', isDrawerVisible);

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    
    return (
      <TouchableOpacity 
        style={styles.hamburgerButton} 
        onPress={() => {
          console.log('Hamburger pressed!');
          openDrawer();
        }}
      >
        <Menu width={24} height={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderCenter = () => {
    if (showLogo) {
      return (
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoImage as ImageStyle} resizeMode="contain" />
        </View>
      );
    }
    if (title) {
      return <Text style={styles.title}>{title}</Text>;
    }
    return null;
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    
    return (
      <View style={styles.rightContainer}>
        {onNotificationPress && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
            <Bell width={24} height={24} color={COLORS.textPrimary} />
            {/* Notification badge */}
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>5</Text>
            </View>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.profileButton} onPress={openDrawer}>
          <View style={styles.profileAvatar}>
            <Home width={20} height={20} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View style={[styles.container, style]}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
      
      {/* Temporarily use SimpleTestDrawer for debugging */}
      <SimpleTestDrawer
        visible={isDrawerVisible}
        onClose={closeDrawer}
      />
      
      {/* Original drawer - commented out for debugging
      <ClientProfileDrawer
        visible={isDrawerVisible}
        onClose={closeDrawer}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToSites={onNavigateToSites}
        onNavigateToGuards={onNavigateToGuards}
        onNavigateToReports={onNavigateToReports}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onNavigateToNotifications={onNavigateToNotifications}
        onNavigateToSupport={onNavigateToSupport}
      />
      */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    minHeight: 60,
    marginTop: 20,
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 30,
  },
});

export default ClientAppHeader;
