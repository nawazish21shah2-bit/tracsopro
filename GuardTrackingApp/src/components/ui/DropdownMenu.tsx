import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  items: DropdownMenuItem[];
  anchorPosition?: { x: number; y: number };
  alignment?: 'left' | 'right';
  style?: ViewStyle;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  visible,
  onClose,
  items,
  anchorPosition,
  alignment = 'right',
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || items.length === 0) return null;

  // Calculate dropdown position
  const dropdownWidth = 200;
  const padding = 16;
  const topOffset = anchorPosition ? anchorPosition.y + 8 : 60;

  const positionStyle: ViewStyle = {
    top: topOffset,
    ...(alignment === 'right' ? { right: padding } : { left: padding }),
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dropdown,
                positionStyle,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }, { translateY }],
                },
                style,
              ]}
            >
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index === 0 && styles.firstMenuItem,
                    index === items.length - 1 && styles.lastMenuItem,
                    item.destructive && styles.destructiveItem,
                    item.disabled && styles.disabledItem,
                  ]}
                  onPress={() => {
                    if (!item.disabled) {
                      item.onPress();
                      onClose();
                    }
                  }}
                  activeOpacity={item.disabled ? 1 : 0.7}
                  disabled={item.disabled}
                >
                  {item.icon && (
                    <View style={styles.menuIcon}>
                      {item.icon}
                    </View>
                  )}
                  <Text
                    style={[
                      styles.menuLabel,
                      item.destructive && styles.destructiveText,
                      item.disabled && styles.disabledText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 200,
    maxWidth: SCREEN_WIDTH - 32,
    ...SHADOWS.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  firstMenuItem: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  destructiveItem: {
    backgroundColor: '#FEF2F2',
  },
  disabledItem: {
    opacity: 0.5,
  },
  menuIcon: {
    marginRight: SPACING.md,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  destructiveText: {
    color: COLORS.error || '#DC2626',
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
});

export default DropdownMenu;





