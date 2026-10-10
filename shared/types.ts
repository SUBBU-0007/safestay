export type HazardType = 'flood' | 'cyclone' | 'landslide';
export type Severity = 'green' | 'amber' | 'red';
export type SafePlaceType = 'shelter' | 'hospital' | 'high_ground' | 'rescue_center';
export type TouristStatus = 'safe' | 'in_danger' | 'sos' | 'unknown';
export type SosTriage = 'rescue' | 'injured' | 'stuck_safe';
export type SosStatus = 'sent' | 'relayed' | 'received' | 'acknowledged' | 'dispatched' | 'resolved';
export type RumorStatus = 'verified' | 'debunked';
export type DeliveryStatus = 'simulated' | 'queued' | 'accepted' | 'sent' | 'delivered' | 'failed' | 'undelivered';

export interface DangerZone {
  id: string;
  name: string;
  hazardType: HazardType;
  severity: Severity;
  // Polygon coordinates: array of [lat, lng]
  coordinates: [number, number][];
  center?: [number, number];
  radiusKm?: number;
  message: string;
  source: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

export interface SafePlace {
  id: string;
  name: string;
  type: SafePlaceType;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  phone: string;
  address: string;
  contactPerson: string;
  amenities: string[];
}

export interface Tourist {
  id: string;
  name: string;
  phone: string;
  country: string;
  language: string; // 'en', 'hi', 'ta', 'ml', 'te', 'kn', 'bn', 'fr', 'de', 'es', 'ar', 'zh', 'ja', 'ru'
  hotel: string;
  lat: number;
  lng: number;
  status: TouristStatus;
  lastUpdated: number;
  notificationConsent?: boolean;
}

export interface Alert {
  id: string;
  zoneId?: string;
  hazardType: HazardType;
  severity: Severity;
  title: string;
  message: string;
  source: string;
  timestamp: number;
  expiresAt: number;
  incidentId?: string;
}

export interface AlertDelivery {
  id: string;
  alertId: string;
  touristId: string;
  touristName: string;
  phone: string;
  language: string;
  message: string;
  sentAt: number;
  status: DeliveryStatus;
  provider?: string;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;
  lastAttemptAt?: number;
}

export interface SosRequest {
  id: string;
  touristName?: string;
  phone: string;
  lat: number;
  lng: number;
  language: string;
  peopleCount: number;
  triage: SosTriage;
  note?: string;
  level: 1 | 2 | 3; // 1: Internet, 2: SMS fallback, 3: Bluetooth mesh
  status: SosStatus;
  timestamp: number;
  hopCount?: number;
  meshPath?: string[];
  assignedRescueCenter?: string;
  etaMinutes?: number;
}

export interface CheckIn {
  id: string;
  touristId?: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  status: 'safe';
  timestamp: number;
  note?: string;
}

export interface RumorNotice {
  id: string;
  title: string;
  content: string;
  status: RumorStatus;
  source: string;
  timestamp: number;
}

export interface SmsMessage {
  id: string;
  to: string;
  body: string;
  language: string;
  timestamp: number;
  alertId?: string;
  touristName?: string;
  provider: string;
  status?: DeliveryStatus;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: 'national' | 'disaster' | 'state' | 'embassy';
  country?: string;
  description: string;
}

export interface Incident {
  id: string;
  zoneId?: string;
  title: string;
  hazardType: HazardType;
  severity: Severity;
  areaName: string;
  message: string;
  instructions: string;
  shelterId?: string;
  shelterName?: string;
  shelterAddress?: string;
  shelterPhone?: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'evacuating' | 'resolved';
}

export interface SmsConfig {
  mode: 'mock' | 'real';
  hasCredentials: boolean;
  accountSidConfigured: boolean;
  phoneNumber?: string;
  publicAppUrl?: string;
  statusCallbackConfigured: boolean;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'alert_issued' | 'zone_activated' | 'evacuation_advisory' | 'shelter_updated' | 'alert_resolved';
  title: string;
  description: string;
  severity?: Severity;
  isForecastOrAdvisory?: boolean;
}
