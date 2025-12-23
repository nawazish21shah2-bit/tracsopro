/**
 * MINIMAL TEST APP - Use this to verify React Native is working
 * Replace index.js content with this temporarily to test
 */

import { AppRegistry } from 'react-native';
import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

const TestApp = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>React Native is Working!</Text>
      <Text style={styles.subtext}>If you see this, the bundle loaded correctly</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});

// Try with lowercase first
AppRegistry.registerComponent('tracsopro', () => TestApp);


