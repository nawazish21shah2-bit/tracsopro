import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

export interface ShiftOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface ShiftOptionPickerProps {
  label: string;
  placeholder: string;
  options: ShiftOption[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  allowNone?: boolean;
  noneLabel?: string;
  noneSublabel?: string;
  required?: boolean;
}

const ShiftOptionPicker: React.FC<ShiftOptionPickerProps> = ({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  allowNone = false,
  noneLabel = 'None',
  noneSublabel,
  required = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const selectedOption =
    selectedId != null && selectedId !== ''
      ? options.find((o) => o.id === selectedId)
      : allowNone
        ? { id: '', label: noneLabel, sublabel: noneSublabel }
        : undefined;

  const displayText = selectedOption?.label || placeholder;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.85}
      >
        <View style={styles.triggerTextBlock}>
          <Text style={[styles.triggerText, !selectedOption && styles.placeholder]} numberOfLines={1}>
            {displayText}
          </Text>
          {selectedOption?.sublabel ? (
            <Text style={styles.triggerSubtext} numberOfLines={1}>
              {selectedOption.sublabel}
            </Text>
          ) : null}
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.list}>
          {allowNone ? (
            <TouchableOpacity
              style={[styles.item, !selectedId && styles.itemSelected]}
              onPress={() => {
                onSelect(undefined);
                setExpanded(false);
              }}
            >
              <Text style={[styles.itemText, !selectedId && styles.itemTextSelected]}>{noneLabel}</Text>
              {noneSublabel ? (
                <Text style={[styles.itemSubtext, !selectedId && styles.itemSubtextSelected]}>{noneSublabel}</Text>
              ) : null}
            </TouchableOpacity>
          ) : null}
          {options.map((option) => {
            const isSelected = selectedId === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.item, isSelected && styles.itemSelected]}
                onPress={() => {
                  onSelect(option.id);
                  setExpanded(false);
                }}
              >
                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]} numberOfLines={1}>
                  {option.label}
                </Text>
                {option.sublabel ? (
                  <Text style={[styles.itemSubtext, isSelected && styles.itemSubtextSelected]} numberOfLines={1}>
                    {option.sublabel}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  triggerTextBlock: {
    flex: 1,
  },
  triggerText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  placeholder: {
    color: COLORS.textTertiary,
  },
  triggerSubtext: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  chevron: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  list: {
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundPrimary,
    maxHeight: 220,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  item: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  itemSelected: {
    backgroundColor: COLORS.primaryLight || '#E8F4FC',
  },
  itemText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  itemTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  itemSubtext: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  itemSubtextSelected: {
    color: COLORS.primary,
  },
});

export default ShiftOptionPicker;
