import React, { useMemo } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
// SVG assets (Figma exports) for guard-side UI
import HomeSvg from '../../assets/icons/House.svg';
import CalendarSvg from '../../assets/icons/CalendarDots.svg';
import ReportsSvg from '../../assets/icons/carbon_report.svg';
import JobsSvg from '../../assets/icons/ReadCvLogo.svg';
import UserSvg from '../../assets/icons/UserCheck.svg';
import MenuSvg from '../../assets/icons/mage_dashboard.svg';
import BellSvg from '../../assets/icons/BellSimple.svg';
import MapPinSvg from '../../assets/icons/MapPin.svg';
import ClockSvg from '../../assets/icons/ClockCountdown.svg';
import WarningSvg from '../../assets/icons/Warning.svg';
import CheckCircleSvg from '../../assets/icons/CheckCircle.svg';
import XCircleSvg from '../../assets/icons/XCircle.svg';
import PersonSvg from '../../assets/icons/bi_person.svg';
import PasswordSvg from '../../assets/icons/carbon_password.svg';
import EyeSvg from '../../assets/icons/Eye.svg';
import EyeSlashSvg from '../../assets/icons/EyeSlash.svg';
import SettingsSvg from '../../assets/icons/ep_setting.svg';
import ArrowSquareOutSvg from '../../assets/icons/ArrowSquareOut.svg';
import SolarArrowUpOutlineSvg from '../../assets/icons/solar_arrow-up-outline.svg';

// Icon types supported by our app
type IconType = 'material' | 'material-community' | 'ionicons' | 'fontawesome';

interface IconProps {
  type: IconType;
  name: string;
  size?: number;
  color?: string;
  style?: any; // Using any to avoid TypeScript errors between different versions of TextStyle
}

// Main Icon component that renders the appropriate icon based on type
export const AppIcon: React.FC<IconProps> = ({
  type,
  name,
  size = 24,
  color = '#000000',
  style,
}) => {
  // Convert style to any to avoid TypeScript errors between different versions of TextStyle
  const iconStyle = style as any;
  
  switch (type) {
    case 'material':
      return <MaterialIcons name={name} size={size} color={color} style={iconStyle} />;
    case 'material-community':
      return <MaterialCommunityIcons name={name} size={size} color={color} style={iconStyle} />;
    case 'ionicons':
      return <Ionicons name={name} size={size} color={color} style={iconStyle} />;
    case 'fontawesome':
      return <FontAwesome name={name} size={size} color={color} style={iconStyle}  />;
    default:
      return <MaterialIcons name="error" size={size} color={color} style={iconStyle} />;
  }
};

// Generic SVG icon wrapper for our Figma-exported assets
// This ensures colors are properly applied to SVG icons even when they have hardcoded colors
type SvgIconProps = { size?: number; color?: string; style?: any; strokeWidth?: number };
const SvgIcon = ({ Svg, size = 24, color, style, strokeWidth }: SvgIconProps & { Svg: any }) => {
  // Explicitly use the passed color, or fall back to default
  // This ensures the color prop is always respected
  const iconColor = color || '#000000';
  
  // Calculate stroke width: use provided value, or default to size/20 (1.2px for 24px icon)
  // For very thin outline: use size/24 (1px for 24px icon)
  // For thin outline: use size/20 (1.2px for 24px icon) - current default
  // For medium outline: use size/12 (2px for 24px icon)
  // For thicker outline: use size/8 (3px for 24px icon)
  const outlineWidth = strokeWidth !== undefined ? strokeWidth : size / 20;
  
  // Use tintColor in style to override hardcoded colors in SVG paths
  // This is the most reliable way to change SVG colors in React Native
  // tintColor works by applying a color filter to the entire SVG
  // For react-native-svg, we also pass fill and stroke directly
  const iconStyle = useMemo(() => {
    return [
      { 
        tintColor: iconColor,
      }, 
      style
    ];
  }, [iconColor, style]);
  
  // Pass color-related props to override hardcoded colors in SVG
  // The SVG transformer should handle these props
  return (
    <Svg 
      width={size} 
      height={size} 
      fill={iconColor}
      stroke={iconColor}
      strokeWidth={outlineWidth}
      color={iconColor}
      style={iconStyle}
    />
  );
};

// Specialized icon components for common use cases
interface CommonIconProps {
  size?: number;
  color?: string;
  style?: any; // Using any to avoid TypeScript errors between different versions of TextStyle
  strokeWidth?: number; // Optional: override default stroke width for outline icons
}

// Navigation icons - matching UI design exactly
// These icons properly respect the color prop for active/inactive states
export const HomeIcon: React.FC<CommonIconProps> = ({ size = 24, color, style, strokeWidth }) => (
  <SvgIcon Svg={HomeSvg} size={size} color={color} style={style} strokeWidth={strokeWidth} />
);

export const DashboardIcon: React.FC<CommonIconProps> = ({ size = 24, color, style, strokeWidth }) => (
  <SvgIcon Svg={MenuSvg} size={size} color={color} style={style} strokeWidth={strokeWidth} />
);

export const ShiftsIcon: React.FC<CommonIconProps> = ({ size = 24, color, style, strokeWidth }) => (
  <SvgIcon Svg={CalendarSvg} size={size} color={color} style={style} strokeWidth={strokeWidth} />
);

export const ReportsIcon: React.FC<CommonIconProps> = ({ size = 24, color, style, strokeWidth }) => (
  <SvgIcon Svg={ReportsSvg} size={size} color={color} style={style} strokeWidth={strokeWidth} />
);

export const JobsIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={JobsSvg} size={size} color={color} style={style} />
);

export const SettingsIcon: React.FC<CommonIconProps> = ({ size = 24, color, style, strokeWidth }) => (
  <SvgIcon Svg={SettingsSvg} size={size} color={color} style={style} strokeWidth={strokeWidth} />
);

// Action icons
export const MenuIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => {
  const lineHeight = Math.max(1, Math.round(size / 10));
  const barWidth = size * 0.8;
  const gap = lineHeight * 1.5;

  return (
    <View style={[{ width: size, height: size, justifyContent: 'center' }, style]}>
      <View
        style={{
          width: barWidth,
          height: lineHeight,
          backgroundColor: color,
          borderRadius: lineHeight / 2,
        }}
      />
      <View
        style={{
          width: barWidth,
          height: lineHeight,
          backgroundColor: color,
          borderRadius: lineHeight / 2,
          marginTop: gap,
        }}
      />
      <View
        style={{
          width: barWidth,
          height: lineHeight,
          backgroundColor: color,
          borderRadius: lineHeight / 2,
          marginTop: gap,
        }}
      />
    </View>
  );
};

export const NotificationIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={BellSvg} size={size} color={color} style={style} />
);

export const LocationIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={MapPinSvg} size={size} color={color} style={style} />
);

export const ClockIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={ClockSvg} size={size} color={color} style={style} />
);

export const CheckInIcon: React.FC<CommonIconProps> = ({ size = 24, color, style, strokeWidth }) => (
  <SvgIcon Svg={ClockSvg} size={size} color={color} style={style} strokeWidth={strokeWidth} />
);

export const IncidentIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={ReportsSvg} size={size} color={color} style={style} />
);

export const EmergencyIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={WarningSvg} size={size} color={color} style={style} />
);

export const UserIcon: React.FC<CommonIconProps> = ({ size = 24, color, style, strokeWidth }) => (
  <SvgIcon Svg={UserSvg} size={size} color={color} style={style} strokeWidth={strokeWidth} />
);

export const ArrowRightIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={ArrowSquareOutSvg} size={size} color={color} style={style} />
);

export const ArrowUpOutlineIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SolarArrowUpOutlineSvg width={size} height={size} color={color} stroke={color} fill="none" style={style} />
);

export const ExternalLinkIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={ArrowSquareOutSvg} size={size} color={color} style={style} />
);

// Status icons
export const CheckCircleIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#4CAF50', style }) => (
  <SvgIcon Svg={CheckCircleSvg} size={size} color={color} style={style} />
);

export const ErrorCircleIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#F44336', style }) => (
  <SvgIcon Svg={XCircleSvg} size={size} color={color} style={style} />
);

export const InfoIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#2196F3', style }) => (
  <AppIcon type="material" name="info" size={size} color={color} style={style} />
);

// Form icons - Updated to match Figma designs
export const EmailIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="mail-outline" size={size} color={color} style={style} />
);

export const PasswordIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={PasswordSvg} size={size} color={color} style={style} />
);

export const PersonIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={PersonSvg} size={size} color={color} style={style} />
);

// Visibility icons for password fields
export const EyeIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={EyeSvg} size={size} color={color} style={style} />
);

export const EyeSlashIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={EyeSlashSvg} size={size} color={color} style={style} />
);

export const CameraIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="photo-camera" size={size} color={color} style={style} />
);

export const DocumentIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <SvgIcon Svg={ReportsSvg} size={size} color={color} style={style} />
);

// Additional icons for Figma designs
export const CompanyIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="groups" size={size} color={color} style={style} />
);

export const IndividualIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="person-outline" size={size} color={color} style={style} />
);

export const OTPIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="vpn-key" size={size} color={color} style={style} />
);

export const UploadIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="cloud-upload" size={size} color={color} style={style} />
);

export const IDCardIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="badge" size={size} color={color} style={style} />
);

export const CertificationIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="verified" size={size} color={color} style={style} />
);

// Additional common utility icons (Material)
export const SearchIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="search" size={size} color={color} style={style} />
);

export const EditIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="edit" size={size} color={color} style={style} />
);

export const PlusIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="add" size={size} color={color} style={style} />
);

export const ChevronRightIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="chevron-right" size={size} color={color} style={style} />
);

export const ChevronDownIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="expand-more" size={size} color={color} style={style} />
);

export const LogoutIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="logout" size={size} color={color} style={style} />
);

// Additional app-wide icons mapped to Material glyphs
export const ArrowLeftIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="arrow-back" size={size} color={color} style={style} />
);

export const SaveIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="save" size={size} color={color} style={style} />
);

export const DollarIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="attach-money" size={size} color={color} style={style} />
);

export const CreditCardIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="credit-card" size={size} color={color} style={style} />
);

export const UsersIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="groups" size={size} color={color} style={style} />
);

export const DownloadIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="file-download" size={size} color={color} style={style} />
);

export const MicIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="mic" size={size} color={color} style={style} />
);

export const SendIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="send" size={size} color={color} style={style} />
);

export const MoreHorizontalIcon: React.FC<CommonIconProps> = ({ size = 24, color = '#000000', style }) => (
  <AppIcon type="material" name="more-horiz" size={size} color={color} style={style} />
);

// Export a default object for easy imports
const AppIcons = {
  HomeIcon,
  DashboardIcon,
  ShiftsIcon,
  ReportsIcon,
  JobsIcon,
  SettingsIcon,
  MenuIcon,
  NotificationIcon,
  LocationIcon,
  ClockIcon,
  CheckInIcon,
  IncidentIcon,
  EmergencyIcon,
  UserIcon,
  ArrowRightIcon,
  ArrowUpOutlineIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  ErrorCircleIcon,
  InfoIcon,
  EmailIcon,
  PasswordIcon,
  PersonIcon,
  CameraIcon,
  DocumentIcon,
  CompanyIcon,
  IndividualIcon,
  OTPIcon,
  UploadIcon,
  IDCardIcon,
  CertificationIcon,
  EyeIcon,
  EyeSlashIcon,
  SearchIcon,
  EditIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  LogoutIcon,
  ArrowLeftIcon,
  SaveIcon,
  DollarIcon,
  CreditCardIcon,
  UsersIcon,
  DownloadIcon,
  MicIcon,
  SendIcon,
  MoreHorizontalIcon,
};

export default AppIcons;
