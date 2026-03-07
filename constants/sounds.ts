import { Platform } from 'react-native';

declare var require: any;

export const soundOptions = [
  { name: 'sound_default', value: 'default' },
  { name: 'sound_alarm_clock', value: 'alarm_clock.mp3' },
  { name: 'sound_alarm_clock1', value: 'alarm_clock1.mp3' },
  { name: 'sound_alarm_clock2', value: 'alarm_clock2.mp3' },
  { name: 'sound_alarm_clock3', value: 'alarm_clock3.mp3' },
  { name: 'sound_alarm_tone', value: 'alarm_tone.mp3' },
  { name: 'sound_alert_alert_clock', value: 'alert_alert_clock.mp3' },
  { name: 'sound_classic_clock_alarm', value: 'classicclockalarm.mp3' },
  { name: 'sound_clock_alarm', value: 'clock_alarm.mp3' },
  { name: 'sound_clock_alarm2', value: 'clock_alarm2.mp3' },
  { name: 'sound_fire_alarm', value: 'fire_alarm.mp3' },
  { name: 'sound_loud_alarm_clock', value: 'loud_alarm_clock.mp3' },
  { name: 'sound_morning_alarm', value: 'morning_alarm.mp3' },
  { name: 'sound_strange_alarm_clock', value: 'strange_alarm_clock.mp3' },
  { name: 'sound_wake_up_clock', value: 'wake_up_clock.mp3' },
];

// For notifications, we can only use boolean (true for default sound)
// Custom sounds are not supported in expo-notifications
export const getNotificationSound = (value: string): boolean => {
  return true; // Always use default system sound for notifications
};

// Map sound values to their required assets for native and URIs for web
const soundMap: Record<string, any> = {
  'alarm_clock.mp3': require('../assets/sounds/alarm_clock.mp3'),
  'alarm_clock1.mp3': require('../assets/sounds/alarm_clock1.mp3'),
  'alarm_clock2.mp3': require('../assets/sounds/alarm_clock2.mp3'),
  'alarm_clock3.mp3': require('../assets/sounds/alarm_clock3.mp3'),
  'alarm_tone.mp3': require('../assets/sounds/alarm_tone.mp3'),
  'alert_alert_clock.mp3': require('../assets/sounds/alert_alert_clock.mp3'),
  'classicclockalarm.mp3': require('../assets/sounds/classicclockalarm.mp3'),
  'clock_alarm.mp3': require('../assets/sounds/clock_alarm.mp3'),
  'clock_alarm2.mp3': require('../assets/sounds/clock_alarm2.mp3'),
  'fire_alarm.mp3': require('../assets/sounds/fire_alarm.mp3'),
  'loud_alarm_clock.mp3': require('../assets/sounds/loud_alarm_clock.mp3'),
  'morning_alarm.mp3': require('../assets/sounds/morning_alarm.mp3'),
  'strange_alarm_clock.mp3': require('../assets/sounds/strange_alarm_clock.mp3'),
  'wake_up_clock.mp3': require('../assets/sounds/wake_up_clock.mp3'),
};

// For sound preview in the picker, we need to handle web and native differently.
export const getSoundAsset = (value: string) => {
  if (value === 'default') {
    return null; // Cannot preview default system sound
  }

  if (Platform.OS === 'web') {
    return { uri: `/assets/sounds/${value}` };
  }

  return soundMap[value] || null;
};
