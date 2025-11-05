import { useState } from 'react';

export const useProfileDrawer = () => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const openDrawer = () => {
    console.log('Opening drawer...');
    setIsDrawerVisible(true);
  };
  
  const closeDrawer = () => {
    console.log('Closing drawer...');
    setIsDrawerVisible(false);
  };
  
  const toggleDrawer = () => {
    console.log('Toggling drawer...');
    setIsDrawerVisible(!isDrawerVisible);
  };

  return {
    isDrawerVisible,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
};
