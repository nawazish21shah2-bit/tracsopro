export type LiveGuardStatus = 'active' | 'on_break' | 'offline' | 'emergency';

export interface LiveGuardMarker {
  guardId: string;
  userId?: string;
  guardName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: LiveGuardStatus;
  siteName?: string;
  timestamp: number;
}
