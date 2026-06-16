import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  /** Include top inset (screens without SharedHeader). Default false — SharedHeader owns top spacing. */
  includeTop?: boolean;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  backgroundColor = '#F8F9FA',
  includeTop = false,
}) => {
  const edges: Edge[] = includeTop
    ? ['top', 'left', 'right', 'bottom']
    : ['left', 'right', 'bottom'];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
