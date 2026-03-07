import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, ChallengeType } from '@/types';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DEFAULT_CHALLENGE_SETTINGS } from '@/constants/alarmConstants';
import { getNotificationSound } from '@/constants/sounds';
import nativeAlarm from '@/utils/nativeAlarm';

interface AlarmState {
  alarms: Alarm[];
  addAlarm: (alarm: Omit<Alarm, 'id'>) => void;
  updateAlarm: (id: string, alarm: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarmEnabled: (id: string) => void;
  rescheduleAllAlarms: () => void;
}

// Cancel all notifications for a specific alarm
const cancelAlarmNotifications = async (alarmId: string) => {
  if (Platform.OS === 'web') return;
  
  if (Platform.OS === 'android') {
    nativeAlarm.cancelAlarm(alarmId);
    // Also cancel any per-day identifiers if they were scheduled via native
    for (let i = 0; i < 7; i++) {
      nativeAlarm.cancelAlarm(`${alarmId}_day_${i}`);
    }
  }

  // Cancel expo notifications as well for compatibility
  await Notifications.cancelScheduledNotificationAsync(`alarm_${alarmId}`).catch(() => {});
  for (let i = 0; i < 7; i++) {
    await Notifications.cancelScheduledNotificationAsync(`alarm_${alarmId}_day_${i}`).catch(() => {});
  }
};

// Schedule a notification for an alarm
const scheduleAlarmNotification = async (alarm: Alarm) => {
  if (Platform.OS === 'web') {
    return;
  }
  
  await cancelAlarmNotifications(alarm.id);

  if (!alarm.isEnabled) {
    return;
  }

  const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);
  const activeDays = alarm.days.map((day, index) => (day ? index : -1)).filter(index => index !== -1);

  // Common notification content for maximum visibility
  const notificationContent: Notifications.NotificationContentInput = {
    title: `🚨 ${alarm.name}`,
    body: alarm.challenge.type !== ChallengeType.NONE
      ? `Wake up! Complete the ${alarm.challenge.type} challenge to dismiss.`
      : 'Time to wake up! Tap to dismiss.',
    sound: false, // Let the app handle the sound playback for looping.
    vibrate: [0, 250, 250, 250],
    data: {
      alarmId: alarm.id,
      type: 'alarm',
      challengeType: alarm.challenge.type,
      autoOpen: true, // Flag to auto-open the challenge screen
    },
    sticky: true,
    autoDismiss: false,
  };

  if (Platform.OS === 'android') {
    (notificationContent as any).priority = 'max';
    (notificationContent as any).channelId = 'alarm-fullscreen';
  }
  if (Platform.OS === 'ios') {
    (notificationContent as any).interruptionLevel = 'timeSensitive';
  }

  // Case 1: Weekly Repeating Alarm
  if (alarm.repeats && activeDays.length > 0) {
    console.log(`Scheduling weekly recurring alarm for ${alarm.name}`);
    for (const dayIndex of activeDays) {
      if (Platform.OS === 'android') {
        const now = new Date();
        const alarmTime = new Date();
        alarmTime.setHours(alarmHour, alarmMinute, 0, 0);
        const currentDay = now.getDay();
        let dayDifference = dayIndex - currentDay;
        if (dayDifference < 0 || (dayDifference === 0 && alarmTime.getTime() <= now.getTime())) {
          dayDifference += 7;
        }
        alarmTime.setDate(now.getDate() + dayDifference);
        
        nativeAlarm.scheduleAlarm(`${alarm.id}_day_${dayIndex}`, alarm.name, alarm.challenge.type, alarm.sound, 'alarm', alarmTime.getTime());
      } else {
        try {
          await Notifications.scheduleNotificationAsync({
            content: notificationContent,
            trigger: {
              type: 'calendar',
              weekday: dayIndex + 1, // Sunday is 1, Monday is 2, etc.
              hour: alarmHour,
              minute: alarmMinute,
              repeats: true,
            } as Notifications.NotificationTriggerInput,
            identifier: `alarm_${alarm.id}_day_${dayIndex}`,
          });
        } catch (e) {
          console.error(`Failed to schedule recurring alarm for day ${dayIndex} for alarm ${alarm.name}:`, e);
        }
      }
    }
  } 
  // Case 2: One-time alarm (either no days selected, or repeats is false)
  else {
    console.log(`Scheduling one-time alarm for ${alarm.name}`);
    const now = new Date();
    let nextTriggerDate: Date | null = null;

    if (activeDays.length > 0) { // One-time but with specific day(s) selected
      const potentialTriggerDates: Date[] = [];
      for (const dayIndex of activeDays) {
        const potentialDate = new Date(now);
        potentialDate.setHours(alarmHour, alarmMinute, 0, 0);
        const currentDay = now.getDay();
        let dayDifference = dayIndex - currentDay;
        if (dayDifference < 0 || (dayDifference === 0 && potentialDate.getTime() <= now.getTime())) {
          dayDifference += 7;
        }
        potentialDate.setDate(now.getDate() + dayDifference);
        potentialTriggerDates.push(potentialDate);
      }
      if (potentialTriggerDates.length > 0) {
        potentialTriggerDates.sort((a, b) => a.getTime() - b.getTime());
        nextTriggerDate = potentialTriggerDates[0];
      }
    } else { // Truly one-time, next occurrence of the time
      const alarmTime = new Date();
      alarmTime.setHours(alarmHour, alarmMinute, 0, 0);
      if (alarmTime.getTime() <= now.getTime()) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }
      nextTriggerDate = alarmTime;
    }

    if (!nextTriggerDate) {
      console.log(`No upcoming trigger found for one-time alarm ${alarm.name}`);
      return;
    }

    if (Platform.OS === 'android') {
      nativeAlarm.scheduleAlarm(alarm.id, alarm.name, alarm.challenge.type, alarm.sound, 'alarm', nextTriggerDate.getTime());
    } else {
      const secondsUntilTrigger = (nextTriggerDate.getTime() - now.getTime()) / 1000;
      if (secondsUntilTrigger <= 0) return;

      try {
        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: { type: 'timeInterval', seconds: secondsUntilTrigger, repeats: false } as Notifications.NotificationTriggerInput,
          identifier: `alarm_${alarm.id}`,
        });
      } catch (e) {
        console.error(`Failed to schedule one-time alarm for ${alarm.name}:`, e);
      }
    }
  }
};

// Clear all alarm notifications (for debugging)
export const clearAllAlarmNotifications = async () => {
  if (Platform.OS === 'web') return 0;
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    let clearedCount = 0;
    for (const notification of scheduledNotifications) {
      if (notification.identifier.startsWith('alarm_') || notification.content.data?.type === 'alarm') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        clearedCount++;
      }
    }
    console.log(`Cleared ${clearedCount} alarm notifications`);
    return clearedCount;
  } catch (error) {
    console.error('Failed to clear alarm notifications:', error);
    return 0;
  }
};

// Reschedule all enabled alarms
const rescheduleAllAlarms = async (alarms: Alarm[]) => {
  if (Platform.OS === 'web') return;
  console.log('Rescheduling all alarms...');
  await Promise.all(alarms.map(alarm => scheduleAlarmNotification(alarm)));
  // Debug: Check all scheduled notifications
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Total scheduled notifications after rescheduling:', scheduledNotifications.length);
    scheduledNotifications.forEach(notification => {
      console.log(`- Scheduled: ${notification.identifier} - ${notification.content.title}`);
    });
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
  }
};

// Debug function to check notification permissions and scheduled notifications
export const debugNotifications = async () => {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Notification permission status:', status);
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Scheduled notifications count:', scheduledNotifications.length);
    scheduledNotifications.forEach(notification => {
      console.log(`Notification: ${notification.identifier}`);
      console.log(`  Title: ${notification.content.title}`);
      console.log(`  Data:`, notification.content.data);
      console.log(`  Trigger:`, notification.trigger);
    });
  } catch (error) {
    console.error('Debug notifications error:', error);
  }
};

// Test notification function to verify notifications work
export const testNotification = async () => {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }
    const notificationContent: Notifications.NotificationContentInput = {
      title: '🧪 Test Alarm',
      body: 'This is a test notification to verify alarms work',
      sound: true,
      vibrate: [0, 250, 250, 250],
      data: {
        type: 'test',
        autoOpen: false,
      },
    };

    if (Platform.OS === 'android') {
      (notificationContent as any).priority = 'max';
      (notificationContent as any).channelId = 'alarm-fullscreen';
    }
    if (Platform.OS === 'ios') {
      (notificationContent as any).interruptionLevel = 'timeSensitive';
    }

    const result = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: { type: 'timeInterval', seconds: 5, repeats: false } as Notifications.NotificationTriggerInput,
      identifier: 'test_notification',
    });
    console.log('Test notification scheduled with identifier:', result);
  } catch (error) {
    console.error('Test notification error:', error);
  }
};


export const useAlarmStore = create<AlarmState>()(
  persist(
    (set, get) => ({
      alarms: [],
      
      addAlarm: (alarm) => {
        const newAlarm = { ...alarm, id: Date.now().toString() };
        set((state) => ({
          alarms: [...state.alarms, newAlarm]
        }));
        
        scheduleAlarmNotification(newAlarm);
      },
      
      updateAlarm: (id, updatedAlarm) => {
        let fullUpdatedAlarm: Alarm | undefined;
        set((state) => {
          const updatedAlarms = state.alarms.map((alarm) => {
            if (alarm.id === id) {
              fullUpdatedAlarm = { ...alarm, ...updatedAlarm };
              return fullUpdatedAlarm;
            }
            return alarm;
          });
          return { alarms: updatedAlarms };
        });
        
        if (fullUpdatedAlarm) {
          scheduleAlarmNotification(fullUpdatedAlarm);
        }
      },
      
      deleteAlarm: (id) => {
        set((state) => ({
          alarms: state.alarms.filter((alarm) => alarm.id !== id)
        }));
        
        cancelAlarmNotifications(id);
      },
      
      toggleAlarmEnabled: (id) => {
        let updatedAlarm: Alarm | undefined;
        set((state) => {
          const updatedAlarms = state.alarms.map((alarm) => {
            if (alarm.id === id) {
              updatedAlarm = { ...alarm, isEnabled: !alarm.isEnabled };
              return updatedAlarm;
            }
            return alarm;
          });
          return { alarms: updatedAlarms };
        });

        if (updatedAlarm) {
          scheduleAlarmNotification(updatedAlarm);
        }
      },
      
      rescheduleAllAlarms: () => {
        const alarms = get().alarms;
        rescheduleAllAlarms(alarms).catch(error => {
          console.error('Failed to reschedule alarms:', error);
        });
      },
    }),
    {
      name: 'wake-me-up-alarms-v3', // Incremented version for new structure
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && Platform.OS !== 'web') {
          setTimeout(() => {
            rescheduleAllAlarms(state.alarms).catch(error => {
              console.error('Failed to reschedule alarms on rehydrate:', error);
            });
          }, 1000);
        }
      },
    }
  )
);

// Helper function to create default days (all false)
export const createDefaultDays = (): boolean[] => Array(7).fill(false); // Sunday to Saturday

// Helper function to create a new alarm with defaults
export const createDefaultAlarm = (): Omit<Alarm, 'id'> => ({
  name: 'Alarm',
  time: '07:00',
  days: createDefaultDays(), // Sunday to Saturday
  sound: 'default',
  isEnabled: true,
  repeats: true,
  challenge: DEFAULT_CHALLENGE_SETTINGS,
  snooze: {
    enabled: true,
    durationMinutes: 10,
    maxCount: 3,
    mustGetUpModeEnabled: false,
    mustGetUpForceMaxDifficulty: false,
  },
});