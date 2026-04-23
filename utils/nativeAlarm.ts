import { NativeModules, Platform } from 'react-native';

const { AlarmModule } = NativeModules;

export interface NativeAlarm {
  scheduleAlarm: (alarmId: string, alarmName: string, challengeType: string, ringtoneUri: string, type: string, snoozeCount: number, timestamp: number) => void;
  cancelAlarm: (alarmId: string) => void;
  stopAlarmService: (alarmId?: string) => void;
  canScheduleExactAlarms: () => Promise<boolean>;
  requestExactAlarmPermission: () => void;
  isIgnoringBatteryOptimizations: () => Promise<boolean>;
  requestIgnoreBatteryOptimizations: () => void;
  canDrawOverlays: () => Promise<boolean>;
  requestOverlayPermission: () => void;
  isDeviceLocked: () => Promise<boolean>;
  startKeepAliveService: (title: string, content: string) => void;
  stopKeepAliveService: () => void;
}

const nativeAlarm: NativeAlarm = {
  scheduleAlarm: (alarmId, alarmName, challengeType, ringtoneUri, type, snoozeCount, timestamp) => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.scheduleAlarm(alarmId, alarmName, challengeType, ringtoneUri, type, snoozeCount, timestamp);
    }
  },
  cancelAlarm: (alarmId) => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.cancelAlarm(alarmId);
    }
  },
  stopAlarmService: (alarmId?: string) => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.stopAlarmService(alarmId || null);
    }
  },
  canScheduleExactAlarms: async () => {
    if (Platform.OS === 'android' && AlarmModule) {
      return await AlarmModule.canScheduleExactAlarms();
    }
    return true;
  },
  requestExactAlarmPermission: () => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.requestExactAlarmPermission();
    }
  },
  isIgnoringBatteryOptimizations: async () => {
    if (Platform.OS === 'android' && AlarmModule) {
      return await AlarmModule.isIgnoringBatteryOptimizations();
    }
    return true;
  },
  requestIgnoreBatteryOptimizations: () => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.requestIgnoreBatteryOptimizations();
    }
  },
  canDrawOverlays: async () => {
    if (Platform.OS === 'android' && AlarmModule) {
      return await AlarmModule.canDrawOverlays();
    }
    return true;
  },
  requestOverlayPermission: () => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.requestOverlayPermission();
    }
  },
  isDeviceLocked: async () => {
    if (Platform.OS === 'android' && AlarmModule) {
      return await AlarmModule.isDeviceLocked();
    }
    return false;
  },
  startKeepAliveService: (title, content) => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.startKeepAliveService(title, content);
    }
  },
  stopKeepAliveService: () => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.stopKeepAliveService();
    }
  }
};

export default nativeAlarm;
