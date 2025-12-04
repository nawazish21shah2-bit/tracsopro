// Core Type Definitions for Guard Tracking App

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed property for full name
  name?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  GUARD = 'GUARD',
  CLIENT = 'CLIENT'
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tempUserId: string | null;
  tempEmail: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

// Guard Management Types
export interface Guard {
  id: string;
  userId: string;
  employeeId: string;
  department: string;
  hireDate: Date;
  emergencyContact: EmergencyContact;
  qualifications: Qualification[];
  performance: PerformanceMetrics;
  status: GuardStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum GuardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated'
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Qualification {
  id: string;
  name: string;
  issuedDate: Date;
  expiryDate?: Date;
  issuingAuthority: string;
  certificateNumber?: string;
}

export interface PerformanceMetrics {
  totalShifts: number;
  completedShifts: number;
  incidentsReported: number;
  averageRating: number;
  lastPerformanceReview?: Date;
}

// Location and Tracking Types
export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  type: LocationType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export enum LocationType {
  BUILDING = 'building',
  PERIMETER = 'perimeter',
  CHECKPOINT = 'checkpoint',
  EMERGENCY = 'emergency'
}

export interface TrackingData {
  id: string;
  guardId: string;
  coordinates: Coordinates;
  timestamp: Date;
  batteryLevel: number;
  isOnline: boolean;
  accuracy: number;
}

export interface Geofence {
  id: string;
  name: string;
  center: Coordinates;
  radius: number;
  type: GeofenceType;
  isActive: boolean;
}

export enum GeofenceType {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  RESTRICTED = 'restricted',
  EMERGENCY = 'emergency'
}

// Shift Management Types
export interface Shift {
  id: string;
  guardId: string;
  location: Location;
  startTime: Date;
  endTime: Date;
  status: ShiftStatus;
  notes?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

// Incident Management Types
export interface Incident {
  id: string;
  guardId: string;
  location: Location;
  type: IncidentType;
  severity: SeverityLevel;
  description: string;
  evidence: Evidence[];
  status: IncidentStatus;
  reportedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  notes?: string;
}

export enum IncidentType {
  SECURITY_BREACH = 'security_breach',
  MEDICAL_EMERGENCY = 'medical_emergency',
  FIRE_ALARM = 'fire_alarm',
  VANDALISM = 'vandalism',
  THEFT = 'theft',
  TRESPASSING = 'trespassing',
  EQUIPMENT_FAILURE = 'equipment_failure',
  OTHER = 'other'
}

export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  file: File;
  description: string;
  timestamp: Date;
  location?: Coordinates;
  uploadedBy: string;
}

export enum EvidenceType {
  PHOTO = 'photo',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}

// Communication Types
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  isRead: boolean;
  attachments?: Attachment[];
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  LOCATION = 'location',
  EMERGENCY = 'emergency'
}

export interface Attachment {
  id: string;
  type: string;
  url: string;
  name: string;
  size: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  SHIFT_REMINDER = 'shift_reminder',
  INCIDENT_ALERT = 'incident_alert',
  EMERGENCY = 'emergency',
  MESSAGE = 'message',
  SYSTEM = 'system'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}

export interface GuardForm {
  employeeId: string;
  department: string;
  emergencyContact: EmergencyContact;
  qualifications: Qualification[];
}

export interface IncidentForm {
  type: IncidentType;
  severity: SeverityLevel;
  description: string;
  location: Location;
  evidence: Evidence[];
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  GuardDashboard: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  RoleSelection: undefined;
  GuardSignup: undefined;
  GuardOTP: { email: string; isPasswordReset?: boolean };
  GuardProfileSetup: undefined;
  ClientAccountType: undefined;
  ClientSignup: { accountType: 'individual' | 'company' };
  ClientOTP: { email: string; accountType: 'individual' | 'company'; isPasswordReset?: boolean };
  ClientProfileSetup: { accountType: 'individual' | 'company' };
  AdminAccountType: undefined;
  AdminSignup: { accountType: 'company' };
  AdminOTP: { email: string; accountType: 'company'; isPasswordReset?: boolean };
  AdminProfileSetup: { accountType: 'company' };
  ForgotPassword: undefined;
  ResetPassword: { email: string; otp: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tracking: undefined;
  Incidents: undefined;
  Messages: undefined;
  Profile: undefined;
};

// State Types
export interface AppState {
  auth: AuthState;
  guards: GuardState;
  locations: LocationState;
  incidents: IncidentState;
  messages: MessageState;
  notifications: NotificationState;
}

export interface GuardState {
  guards: Guard[];
  currentGuard: Guard | null;
  isLoading: boolean;
  error: string | null;
}

export interface LocationState {
  locations: Location[];
  currentLocation: Location | null;
  trackingData: TrackingData[];
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface IncidentState {
  incidents: Incident[];
  currentIncident: Incident | null;
  isLoading: boolean;
  error: string | null;
}

export interface MessageState {
  messages: Message[];
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}
