
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, MedicationDose } from '@/types';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DOSAGE_UNITS } from '@/constants/medicationConstants';
import { lightColors } from '@/constants/colors';
import nativeAlarm from '@/utils/nativeAlarm';
import { ChallengeType } from '@/types';

interface MedicationState {
  medications: Medication[];
  medicationToEditId: string | null;
  isCreatingNewMedication: boolean;
  setMedicationToEditId: (id: string | null) => void;
  setIsCreatingNewMedication: (isCreating: boolean) => void;
  addMedication: (medication: Omit<Medication, 'id'>) => void;
  updateMedication: (id: string, medication: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  addDose: (medicationId: string, dose: Omit<MedicationDose, 'id'>) => void;
  updateDose: (medicationId: string, doseId: string, dose: Partial<MedicationDose>) => void;
  deleteDose: (medicationId: string, doseId: string) => void;
  decrementInventory: (medicationId: string, amount?: number) => void;
  refillMedication: (medicationId: string, amount: number) => void;
  scheduleMedicationNotifications: (medication: Medication) => void;
}

// Schedule notifications for medication doses
const scheduleMedicationNotifications = async (medication: Medication) => {
  if (Platform.OS === 'web') return;

  // Cancel existing notifications for this medication
  if (Platform.OS === 'android') {
    nativeAlarm.cancelAlarm(medication.id);
    for (let i = 0; i < 7; i++) {
      nativeAlarm.cancelAlarm(`${medication.id}_dose_${i}`);
    }
  }

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.medicationId === medication.id) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Schedule new notifications for each dose
  for (const dose of medication.doses) {
    const activeDays = dose.days
      .map((isActive, index) => (isActive ? index : -1))
      .filter((index) => index !== -1);

    const [hours, minutes] = dose.time.split(':').map(Number);

    if (Platform.OS === 'android') {
      // Use Native Alarm for Android
      if (activeDays.length === 0) {
        const now = new Date();
        const medTime = new Date();
        medTime.setHours(hours, minutes, 0, 0);
        if (medTime.getTime() <= now.getTime()) {
          medTime.setDate(medTime.getDate() + 1);
        }
        // For medications, we use ChallengeType.NONE by default
        nativeAlarm.scheduleAlarm(
          `${medication.id}_${dose.id}`,
          `💊 ${medication.name}`,
          ChallengeType.NONE,
          '', // Default sound
          'medication',
          medTime.getTime()
        );
      } else {
        for (const dayIndex of activeDays) {
          const now = new Date();
          const medTime = new Date();
          medTime.setHours(hours, minutes, 0, 0);
          const currentDay = now.getDay();
          let dayDifference = dayIndex - currentDay;
          if (dayDifference < 0 || (dayDifference === 0 && medTime.getTime() <= now.getTime())) {
            dayDifference += 7;
          }
          medTime.setDate(now.getDate() + dayDifference);

          nativeAlarm.scheduleAlarm(
            `${medication.id}_${dose.id}_day_${dayIndex}`,
            `💊 ${medication.name}`,
            ChallengeType.NONE,
            '',
            'medication',
            medTime.getTime()
          );
        }
      }
    } else {
      // Fallback to Expo Notifications for iOS
      const notificationContent: Notifications.NotificationContentInput = {
        title: `💊 ${medication.name}`,
        body: `Time to take your ${medication.dosage} ${medication.dosageUnit}${dose.note ? ` - ${dose.note}` : ''}`,
        sound: true,
        vibrate: [0, 250, 250, 250],
        data: {
          medicationId: medication.id,
          doseId: dose.id,
          type: 'medication',
          autoOpen: true,
        },
        sticky: true,
        autoDismiss: false,
      };

      if (Platform.OS === 'ios') {
        (notificationContent as any).interruptionLevel = 'timeSensitive';
      }

      if (activeDays.length === 0) {
        const now = new Date();
        const medTime = new Date();
        medTime.setHours(hours, minutes, 0, 0);
        if (medTime.getTime() <= now.getTime()) {
          medTime.setDate(medTime.getDate() + 1);
        }

        const seconds = (medTime.getTime() - now.getTime()) / 1000;
        if (seconds > 0) {
          await Notifications.scheduleNotificationAsync({
            content: notificationContent,
            trigger: { type: 'timeInterval', seconds, repeats: false } as Notifications.NotificationTriggerInput,
            identifier: `medication_${medication.id}_${dose.id}_once`,
          });
        }
      } else {
        for (const dayIndex of activeDays) {
          await Notifications.scheduleNotificationAsync({
            content: notificationContent,
            trigger: {
              type: 'calendar',
              hour: hours,
              minute: minutes,
              weekday: dayIndex + 1,
              repeats: true,
            } as Notifications.NotificationTriggerInput,
            identifier: `medication_${medication.id}_${dose.id}_day_${dayIndex}`,
          });
        }
      }
    }
  }
};

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set, get) => ({
      medications: [],
      medicationToEditId: null,
      isCreatingNewMedication: false,

      setMedicationToEditId: (id) => set({ medicationToEditId: id }),
      setIsCreatingNewMedication: (isCreating) => set({ isCreatingNewMedication: isCreating }),

      addMedication: (medication) => {
        const newMedication = { ...medication, id: Date.now().toString() };
        set((state) => ({
          medications: [...state.medications, newMedication]
        }));

        if (Platform.OS !== 'web') {
          scheduleMedicationNotifications(newMedication);
        }
      },

      updateMedication: (id, updatedMedication) => {
        set((state) => {
          const updatedMedications = state.medications.map((medication) =>
            medication.id === id ? { ...medication, ...updatedMedication } : medication
          );

          if (Platform.OS !== 'web') {
            const medication = updatedMedications.find(m => m.id === id);
            if (medication) {
              scheduleMedicationNotifications(medication);
            }
          }

          return { medications: updatedMedications };
        });
      },

      deleteMedication: (id) => {
        set((state) => ({
          medications: state.medications.filter((medication) => medication.id !== id)
        }));

        if (Platform.OS !== 'web') {
          // Cancel notifications for deleted medication
          Notifications.getAllScheduledNotificationsAsync().then(notifications => {
            notifications.forEach(notification => {
              if (notification.content.data?.medicationId === id) {
                Notifications.cancelScheduledNotificationAsync(notification.identifier);
              }
            });
          });
        }
      },

      addDose: (medicationId, dose) => {
        set((state) => {
          const updatedMedications = state.medications.map((medication) =>
            medication.id === medicationId
              ? {
                ...medication,
                doses: [...medication.doses, { ...dose, id: Date.now().toString() }]
              }
              : medication
          );

          if (Platform.OS !== 'web') {
            const medication = updatedMedications.find(m => m.id === medicationId);
            if (medication) {
              scheduleMedicationNotifications(medication);
            }
          }

          return { medications: updatedMedications };
        });
      },

      updateDose: (medicationId, doseId, updatedDose) => {
        set((state) => {
          const updatedMedications = state.medications.map((medication) =>
            medication.id === medicationId
              ? {
                ...medication,
                doses: medication.doses.map((dose) =>
                  dose.id === doseId ? { ...dose, ...updatedDose } : dose
                )
              }
              : medication
          );

          if (Platform.OS !== 'web') {
            const medication = updatedMedications.find(m => m.id === medicationId);
            if (medication) {
              scheduleMedicationNotifications(medication);
            }
          }

          return { medications: updatedMedications };
        });
      },

      deleteDose: (medicationId, doseId) => {
        set((state) => {
          const updatedMedications = state.medications.map((medication) =>
            medication.id === medicationId
              ? {
                ...medication,
                doses: medication.doses.filter((dose) => dose.id !== doseId)
              }
              : medication
          );

          if (Platform.OS !== 'web') {
            const medication = updatedMedications.find(m => m.id === medicationId);
            if (medication) {
              scheduleMedicationNotifications(medication);
            }
          }

          return { medications: updatedMedications };
        });
      },

      decrementInventory: (medicationId, amount = 1) => set((state) => ({
        medications: state.medications.map((medication) =>
          medication.id === medicationId && medication.trackInventory && medication.totalCount !== undefined
            ? {
              ...medication,
              totalCount: Math.max(0, medication.totalCount - amount)
            }
            : medication
        )
      })),

      refillMedication: (medicationId, amount) => set((state) => ({
        medications: state.medications.map((medication) =>
          medication.id === medicationId && medication.trackInventory
            ? {
              ...medication,
              totalCount: (medication.totalCount || 0) + amount
            }
            : medication
        )
      })),

      scheduleMedicationNotifications: (medication) => {
        if (Platform.OS !== 'web') {
          scheduleMedicationNotifications(medication);
        }
      },
    }),
    {
      name: 'wake-me-up-medications',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && Platform.OS !== 'web') {
          // Reschedule all medication notifications when store is rehydrated
          setTimeout(() => {
            state.medications.forEach(medication => {
              scheduleMedicationNotifications(medication);
            });
          }, 1000);
        }
      },
    }
  )
);

// Helper function to create a default medication
export const createDefaultMedication = (): Omit<Medication, 'id'> => ({
  name: '',
  dosage: '1',
  dosageUnit: DOSAGE_UNITS[0],
  color: lightColors.primary,
  doses: [{ ...createDefaultDose(), id: Date.now().toString() }],
  trackInventory: false,
  refillReminderEnabled: true,
  notes: '',
  scheduleText: '',
  pillsPerDose: 1,
  totalCount: 0,
  lowStockThreshold: 10,
});

// Helper function to create a default dose
export const createDefaultDose = (): Omit<MedicationDose, 'id'> => ({
  time: '08:00',
  days: Array(7).fill(true), // Default to all days true for better UX
  note: '',
});