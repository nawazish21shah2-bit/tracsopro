import React from 'react';
import { ViewStyle } from 'react-native';
import { FeatherIcon, FeatherIconName } from './FeatherIcons';

interface CommonIconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

type IconType = 'material' | 'material-community' | 'ionicons' | 'fontawesome';

interface IconProps extends CommonIconProps {
  type: IconType;
  name: string;
}

const STROKE_WIDTH = 2;

const createFeatherIcon = (
  name: FeatherIconName,
  defaultColor = '#000000',
): React.FC<CommonIconProps> => {
  const IconComponent: React.FC<CommonIconProps> = ({
    size = 24,
    color = defaultColor,
    style,
  }) => (
    <FeatherIcon
      name={name}
      size={size}
      color={color}
      style={style}
      strokeWidth={STROKE_WIDTH}
    />
  );

  IconComponent.displayName = `AppIcons.${name}`;
  return IconComponent;
};

/** Maps legacy Material / Ionic icon names to Feather equivalents */
const LEGACY_ICON_MAP: Record<string, FeatherIconName> = {
  info: 'info',
  'mail-outline': 'mail',
  'photo-camera': 'camera',
  groups: 'users',
  'person-outline': 'user',
  'vpn-key': 'key',
  'cloud-upload': 'upload',
  badge: 'creditCard',
  verified: 'checkCircle',
  search: 'search',
  edit: 'edit',
  add: 'plus',
  'chevron-right': 'chevronRight',
  'expand-more': 'chevronDown',
  'keyboard-arrow-up': 'chevronUp',
  'keyboard-arrow-down': 'chevronDown',
  logout: 'logOut',
  'arrow-back': 'arrowLeft',
  save: 'save',
  'attach-money': 'dollarSign',
  'credit-card': 'creditCard',
  'file-download': 'download',
  mic: 'mic',
  send: 'send',
  'more-horiz': 'moreHorizontal',
  check: 'check',
  dashboard: 'activity',
  'confirmation-number': 'fileText',
  'insert-chart-outlined': 'barChart',
  security: 'shield',
  business: 'briefcase',
  'admin-panel-settings': 'settings',
  'lock-outline': 'lock',
  'lock-closed-outline': 'lock',
  'help-outline': 'info',
};

export const AppIcon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#000000',
  style,
}) => {
  const featherName = LEGACY_ICON_MAP[name] ?? 'alertCircle';

  return (
    <FeatherIcon
      name={featherName}
      size={size}
      color={color}
      style={style}
      strokeWidth={STROKE_WIDTH}
    />
  );
};

// Navigation icons
export const HomeIcon = createFeatherIcon('home');
export const DashboardIcon = createFeatherIcon('activity');
export const ShiftsIcon = createFeatherIcon('calendar');
export const ReportsIcon = createFeatherIcon('fileText');
export const JobsIcon = createFeatherIcon('briefcase');
export const SettingsIcon = createFeatherIcon('settings');
export const MenuIcon = createFeatherIcon('menu');

// Action icons
export const NotificationIcon = createFeatherIcon('bell');
export const LocationIcon = createFeatherIcon('mapPin');
export const ClockIcon = createFeatherIcon('clock');
export const CheckInIcon = createFeatherIcon('clock');
export const IncidentIcon = createFeatherIcon('fileText');
export const EmergencyIcon = createFeatherIcon('alertTriangle');
export const UserIcon = createFeatherIcon('user');
export const ArrowRightIcon = createFeatherIcon('arrowRight');
export const ArrowUpOutlineIcon = createFeatherIcon('arrowUp');
export const ExternalLinkIcon = createFeatherIcon('externalLink');

// Status icons
export const CheckCircleIcon = createFeatherIcon('checkCircle', '#4CAF50');
export const ErrorCircleIcon = createFeatherIcon('xCircle', '#F44336');
export const InfoIcon = createFeatherIcon('info', '#2196F3');

// Form icons
export const EmailIcon = createFeatherIcon('mail');
export const PasswordIcon = createFeatherIcon('lock');
export const PersonIcon = createFeatherIcon('user');
export const EyeIcon = createFeatherIcon('eye');
export const EyeSlashIcon = createFeatherIcon('eyeOff');
export const CameraIcon = createFeatherIcon('camera');
export const DocumentIcon = createFeatherIcon('fileText');

// Account type icons
export const CompanyIcon = createFeatherIcon('users');
export const IndividualIcon = createFeatherIcon('user');
export const OTPIcon = createFeatherIcon('key');
export const UploadIcon = createFeatherIcon('upload');
export const IDCardIcon = createFeatherIcon('creditCard');
export const CertificationIcon = createFeatherIcon('checkCircle');

// Utility icons
export const SearchIcon = createFeatherIcon('search');
export const EditIcon = createFeatherIcon('edit');
export const PlusIcon = createFeatherIcon('plus');
export const ChevronRightIcon = createFeatherIcon('chevronRight');
export const ChevronDownIcon = createFeatherIcon('chevronDown');
export const LogoutIcon = createFeatherIcon('logOut');
export const ArrowLeftIcon = createFeatherIcon('arrowLeft');
export const SaveIcon = createFeatherIcon('save');
export const DollarIcon = createFeatherIcon('dollarSign');
export const CreditCardIcon = createFeatherIcon('creditCard');
export const UsersIcon = createFeatherIcon('users');
export const DownloadIcon = createFeatherIcon('download');
export const MicIcon = createFeatherIcon('mic');
export const SendIcon = createFeatherIcon('send');
export const MoreHorizontalIcon = createFeatherIcon('moreHorizontal');
export const ChatIcon = createFeatherIcon('messageCircle');
export const CopyIcon = createFeatherIcon('copy');
export const TrashIcon = createFeatherIcon('trash2');

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
  ChatIcon,
  CopyIcon,
  TrashIcon,
};

export default AppIcons;
