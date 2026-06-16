import React from 'react';
import { ViewStyle } from 'react-native';
import StatsCard from './StatsCard';

interface AdminStatsCardProps {
  label: string;
  value: string | number;
  subLabel: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  style?: ViewStyle;
  variant?: 'success' | 'danger' | 'info' | 'neutral' | 'warning';
}

/** @deprecated Use StatsCard with layout="vertical" directly. */
const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  label,
  value,
  subLabel,
  icon,
  variant = 'neutral',
  style,
}) => (
  <StatsCard
    label={label}
    value={value}
    subLabel={subLabel}
    icon={icon}
    variant={variant}
    layout="vertical"
    style={style}
  />
);

export default AdminStatsCard;
