import React from 'react';
import { View, SafeAreaView, StatusBar, Platform, StyleSheet } from 'react-native';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ 
  children, 
  backgroundColor = '#F8F9FA' 
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});

export default SafeAreaWrapper;
