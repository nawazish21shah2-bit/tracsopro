import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { getCardStyle, getIconContainerStyle, getStatusDotStyle, getTextStyle, UI_COLORS } from '../../styles/uiStyles';
import { ChevronRight } from 'react-native-feather';

interface StreamlinedCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  status?: 'active' | 'inactive' | 'warning' | 'error';
  onPress?: () => void;
  children?: React.ReactNode;
}

export const StreamlinedCard: React.FC<StreamlinedCardProps> = ({
  title,
  subtitle,
  icon,
  isActive = false,
  disabled = false,
  showChevron = false,
  status,
  onPress,
  children,
}) => {
  const cardVariant = disabled ? 'disabled' : isActive ? 'active' : 'inactive';
  const iconVariant = disabled ? 'disabled' : isActive ? 'active' : 'inactive';
  const textVariant = disabled ? 'disabled' : isActive ? 'active' : 'primary';
  const subtitleVariant = disabled ? 'disabled' : isActive ? 'active' : 'secondary';

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        ...getCardStyle(cardVariant),
        styles.container,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.content}>
        {icon && (
          <View style={[...getIconContainerStyle(iconVariant), styles.iconContainer]}>
            {icon}
          </View>
        )}
        
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[getTextStyle(textVariant), styles.title]} numberOfLines={1}>
              {title}
            </Text>
            {status && (
              <View style={styles.statusContainer}>
                <View style={getStatusDotStyle(status)} />
                <Text style={[getTextStyle(subtitleVariant), styles.statusText]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </View>
            )}
          </View>
          
          {subtitle && (
            <Text style={[getTextStyle(subtitleVariant), styles.subtitle]} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {showChevron && (
          <View style={styles.chevronContainer}>
            <ChevronRight 
              width={16} 
              height={16} 
              color={isActive ? UI_COLORS.textActive : UI_COLORS.inactive} 
            />
          </View>
        )}
      </View>
      
      {children && (
        <View style={styles.childrenContainer}>
          {children}
        </View>
      )}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chevronContainer: {
    marginLeft: 8,
  },
  childrenContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.borderLight,
  },
});

export default StreamlinedCard;
