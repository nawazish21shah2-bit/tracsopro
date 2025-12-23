import { useState, useCallback } from 'react';

export const useProfileDrawer = () => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const openDrawer = useCallback(() => {
    console.log('Opening drawer...');
    setIsDrawerVisible(true);
  }, []);
  
  const closeDrawer = useCallback(() => {
    console.log('Closing drawer...');
    setIsDrawerVisible(false);
  }, []);
  
  const toggleDrawer = useCallback(() => {
    console.log('Toggling drawer, current state:', isDrawerVisible);
    setIsDrawerVisible(prev => {
      const newState = !prev;
      console.log('Toggling drawer to:', newState);
      return newState;
    });
  }, [isDrawerVisible]);

  return {
    isDrawerVisible,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
};
