import React from 'react';
import NotificationListScreen from '../notifications/NotificationListScreen';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

const ClientNotifications: React.FC = () => {
  return <NotificationListScreen variant="client" />;
};

export default ClientNotifications;
