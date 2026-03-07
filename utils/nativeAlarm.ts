import { NativeModules, Platform } from 'react-native';

const { AlarmModule } = NativeModules;

export interface NativeAlarm {
  scheduleAlarm: (alarmId: string, alarmName: string, challengeType: string, ringtoneUri: string, type: string, timestamp: number) => void;
  cancelAlarm: (alarmId: string) => void;
  stopAlarmService: () => void;
}

const nativeAlarm: NativeAlarm = {
  scheduleAlarm: (alarmId, alarmName, challengeType, ringtoneUri, type, timestamp) => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.scheduleAlarm(alarmId, alarmName, challengeType, ringtoneUri, type, timestamp);
    }
  },
  cancelAlarm: (alarmId) => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.cancelAlarm(alarmId);
    }
  },
  stopAlarmService: () => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.stopAlarmService();
    }
  },
};

export default nativeAlarm;
