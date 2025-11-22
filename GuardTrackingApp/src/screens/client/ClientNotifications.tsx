import React from 'react';
import NotificationSettingsScreen from '../settings/NotificationSettingsScreen';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

const ClientNotifications: React.FC = () => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  return (
    <NotificationSettingsScreen
      variant="client"
      profileDrawer={
        <ClientProfileDrawer
          visible={isDrawerVisible}
          onClose={closeDrawer}
          onNavigateToNotifications={() => {
            closeDrawer();
          }}
        />
      }
    />
  );
};

export default ClientNotifications;
