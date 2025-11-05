// Enhanced Card Component
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

export interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  variant = 'default',
  size = 'medium',
  style,
  titleStyle,
  subtitleStyle,
  disabled = false,
  loading = false,
  testID = 'card',
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card, styles[`${variant}Card`], styles[`${size}Card`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledCard);
    }
    
    return baseStyle;
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[getCardStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, titleStyle]} testID={`${testID}-title`}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]} testID={`${testID}-subtitle`}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      {children && (
        <View style={styles.content} testID={`${testID}-content`}>
          {children}
        </View>
      )}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  
  // Variants
  defaultCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  elevatedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  filledCard: {
    backgroundColor: '#F8F9FA',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  // Sizes
  smallCard: {
    padding: 12,
  },
  mediumCard: {
    padding: 16,
  },
  largeCard: {
    padding: 20,
  },
  
  // States
  disabledCard: {
    opacity: 0.6,
  },
  
  // Header
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  
  // Content
  content: {
    flex: 1,
  },
});

export default Card;