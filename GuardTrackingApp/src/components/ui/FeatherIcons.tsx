import React from 'react';
import { ViewStyle } from 'react-native';
import {
  Home,
  Clock,
  Calendar,
  FileText,
  Briefcase,
  User,
  Menu,
  Bell,
  MapPin,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Settings,
  LogOut,
  Camera,
  Upload,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Share,
  Phone,
  Mail,
  Lock,
  Unlock,
  Shield,
  Key,
  Star,
  Heart,
  Bookmark,
  MessageCircle,
  Send,
  RefreshCw,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  Bluetooth,
  Navigation,
  Compass,
  Target,
  Zap,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Thermometer,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Globe,
  Link,
  ExternalLink,
  Copy,
  Clipboard,
  Folder,
  File,
  Image,
  Video,
  Music,
  Headphones,
  Mic,
  MicOff,
  Speaker,
  Monitor,
  Smartphone,
  Tablet,
  HardDrive,
  Server,
  Database,
  Cpu,
  Power,
} from 'react-native-feather';

import { COLORS } from '../../styles/globalStyles';

interface FeatherIconProps {
  name: keyof typeof iconMap;
  size?: number;
  color?: string;
  style?: ViewStyle;
  strokeWidth?: number;
}

// Icon mapping for easy access
const iconMap = {
  // Navigation & UI
  home: Home,
  clock: Clock,
  calendar: Calendar,
  fileText: FileText,
  briefcase: Briefcase,
  user: User,
  menu: Menu,
  bell: Bell,
  mapPin: MapPin,
  
  // Alerts & Status
  alertTriangle: AlertTriangle,
  alertCircle: AlertCircle,
  checkCircle: CheckCircle,
  
  // Settings & Actions
  settings: Settings,
  logOut: LogOut,
  camera: Camera,
  upload: Upload,
  eye: Eye,
  eyeOff: EyeOff,
  
  // Arrows & Navigation
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  
  // Basic Actions
  plus: Plus,
  minus: Minus,
  x: X,
  check: Check,
  search: Search,
  filter: Filter,
  edit: Edit,
  trash2: Trash2,
  download: Download,
  share: Share,
  
  // Communication
  phone: Phone,
  mail: Mail,
  messageCircle: MessageCircle,
  send: Send,
  
  // Security
  lock: Lock,
  unlock: Unlock,
  shield: Shield,
  key: Key,
  
  // Social
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  
  // Media Controls
  refresh: RefreshCw,
  rotateCcw: RotateCcw,
  play: Play,
  pause: Pause,
  volume2: Volume2,
  volumeX: VolumeX,
  
  // Connectivity
  wifi: Wifi,
  wifiOff: WifiOff,
  battery: Battery,
  bluetooth: Bluetooth,
  
  // Location & Navigation
  navigation: Navigation,
  compass: Compass,
  target: Target,
  
  // Weather & Environment
  zap: Zap,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  cloudRain: CloudRain,
  thermometer: Thermometer,
  
  // Analytics & Data
  activity: Activity,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  barChart: BarChart,
  pieChart: PieChart,
  
  // Web & Links
  globe: Globe,
  link: Link,
  externalLink: ExternalLink,
  copy: Copy,
  clipboard: Clipboard,
  
  // Files & Media
  folder: Folder,
  file: File,
  image: Image,
  video: Video,
  music: Music,
  
  // Audio & Recording
  headphones: Headphones,
  mic: Mic,
  micOff: MicOff,
  speaker: Speaker,
  
  // Devices
  monitor: Monitor,
  smartphone: Smartphone,
  tablet: Tablet,
  
  // Hardware
  hardDrive: HardDrive,
  server: Server,
  database: Database,
  cpu: Cpu,
  power: Power,
};

export const FeatherIcon: React.FC<FeatherIconProps> = ({
  name,
  size = 24,
  color = COLORS.textPrimary,
  style,
  strokeWidth = 2,
}) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`FeatherIcon: Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent
      width={size}
      height={size}
      stroke={color}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
};

// Convenience components for commonly used icons
export const HomeIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="home" {...props} />
);

export const ClockIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="clock" {...props} />
);

export const CalendarIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="calendar" {...props} />
);

export const FileTextIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="fileText" {...props} />
);

export const BriefcaseIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="briefcase" {...props} />
);

export const UserIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="user" {...props} />
);

export const MenuIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="menu" {...props} />
);

export const BellIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="bell" {...props} />
);

export const MapPinIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="mapPin" {...props} />
);

export const AlertTriangleIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="alertTriangle" {...props} />
);

export const AlertCircleIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="alertCircle" {...props} />
);

export const CheckCircleIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="checkCircle" {...props} />
);

export const SettingsIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="settings" {...props} />
);

export const LogOutIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="logOut" {...props} />
);

export const LockIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="lock" {...props} />
);

export const KeyIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="key" {...props} />
);

export const EyeIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="eye" {...props} />
);

export const EyeOffIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="eyeOff" {...props} />
);

export const ArrowRightIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="arrowRight" {...props} />
);

export const SearchIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="search" {...props} />
);

export const PlusIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="plus" {...props} />
);

export const EditIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="edit" {...props} />
);

export const ExternalLinkIcon: React.FC<Omit<FeatherIconProps, 'name'>> = (props) => (
  <FeatherIcon name="externalLink" {...props} />
);

export default FeatherIcon;
