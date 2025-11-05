import { useState } from 'react';

export const useGuardProfileDrawer = () => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const openDrawer = () => setIsDrawerVisible(true);
  const closeDrawer = () => setIsDrawerVisible(false);
  const toggleDrawer = () => setIsDrawerVisible(!isDrawerVisible);

  return {
    isDrawerVisible,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
};
