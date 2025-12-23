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
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface DropdownAction {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface SiteCardDropdownProps {
  visible: boolean;
  onClose: () => void;
  actions: DropdownAction[];
  anchorPosition: { x: number; y: number };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SiteCardDropdown: React.FC<SiteCardDropdownProps> = ({
  visible,
  onClose,
  actions,
  anchorPosition,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || actions.length === 0) return null;

  // Calculate dropdown position - align to right edge of screen with padding
  const dropdownWidth = 180;
  const rightPadding = 16;
  const topOffset = 8; // Space below the button

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dropdown,
                {
                  top: anchorPosition.y + topOffset,
                  right: rightPadding,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionItem,
                    index === 0 && styles.firstActionItem,
                    index === actions.length - 1 && styles.lastActionItem,
                    action.destructive && styles.destructiveAction,
                  ]}
                  onPress={() => {
                    action.onPress();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIcon}>
                    {action.icon}
                  </View>
                  <Text
                    style={[
                      styles.actionText,
                      action.destructive && styles.destructiveText,
                    ]}
                  >
                    {action.label}
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 180,
    ...SHADOWS.large,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  firstActionItem: {
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  lastActionItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: BORDER_RADIUS.md,
    borderBottomRightRadius: BORDER_RADIUS.md,
  },
  destructiveAction: {
    backgroundColor: COLORS.errorLight || '#FEF2F2',
  },
  actionIcon: {
    marginRight: SPACING.md,
    width: 20,
    alignItems: 'center',
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    flex: 1,
  },
  destructiveText: {
    color: COLORS.error || '#DC2626',
  },
});

export default SiteCardDropdown;

