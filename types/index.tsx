// Challenge Types for Alarms
export enum ChallengeType {
  NONE = 'none',
  MATH = 'math',
  WORD_PUZZLE = 'word',
  QR_SCAN = 'qrcode',
}

export interface MathChallengeConfig {
  difficulty: number;
  questions: number;
}

export interface WordPuzzleConfig {
  difficulty: number;
}

export interface QRScanConfig {
  targetValue: string;
}

export type ChallengeConfig = MathChallengeConfig | WordPuzzleConfig | QRScanConfig | null;

export interface Challenge {
  type: ChallengeType;
  config: ChallengeConfig;
}


// Alarm Types
export interface SnoozeSettings {
  enabled: boolean;
  durationMinutes: number;
  maxCount: number;
  mustGetUpModeEnabled: boolean;
  mustGetUpForceMaxDifficulty: boolean;
}

export interface Alarm {
  id: string;
  name: string;
  time: string; // HH:MM format
  days: boolean[]; // Array of 7 booleans, starting with Sunday
  sound: string;
  isEnabled: boolean;
  challenge: Challenge;
  snooze: SnoozeSettings;
  repeats: boolean;
}

// Medication Types
export interface MedicationDose {
  id: string;
  time: string; // HH:MM format
  days: boolean[];
  note?: string;
}

export interface Medication {
  id:string;
  name: string;
  dosage: string; // The numeric part of the dose, e.g., "1", "500"
  dosageUnit: string; // The unit, e.g., "tablet", "mg"
  imageUri?: string;
  color: string;
  doses: MedicationDose[];
  trackInventory: boolean;
  totalCount?: number;
  pillsPerDose?: number; // How many pills constitute one dose
  lowStockThreshold?: number;
  refillPharmacyContact?: string;
  scheduleText?: string; // e.g., "Twice daily with meals"
  notes?: string; // General notes about the medication
  refillReminderEnabled?: boolean;
}

export interface MedicationAdherenceDetail {
  medicationId: string;
  medicationName: string;
  adherenceRate: number;
  takenCount: number;
  scheduledCount: number;
  skippedCount: number;
}

// Event Log Types
export type EventType = 
  | 'alarm_triggered' 
  | 'alarm_snoozed' 
  | 'alarm_dismissed' 
  | 'medication_taken' 
  | 'medication_skipped'
  | 'medication_snoozed'
  | 'medication_refilled'
  | 'low_stock_alert'
  | 'medication_added'
  | 'medication_updated'
  | 'medication_deleted';

export interface EventLog {
  id: string;
  type: EventType;
  timestamp: number;
  itemId: string; // ID of the alarm or medication
  itemName: string; // Name of the alarm or medication
  details?: string; // Additional details
}

// App Settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'ar' | 'ru' | 'de';
  notificationSound: string;
  vibrationEnabled: boolean;
  exportDataFormat: 'csv' | 'json';
}