
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, BackHandler, Platform, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useMedicationStore } from '@/store/medicationStore';
import { useEventLogStore } from '@/store/eventLogStore';
import Button from '@/components/ui/Button';
import { Pill, Check, X, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '@/store/settingsStore';
import { Medication, MedicationDose } from '@/types';
import nativeAlarm from '@/utils/nativeAlarm';
import { InterstitialAd, AdEventType, TestIds } from '@/utils/adMob';

// AdMob Interstitial Ad Unit ID (using Test ID for now)
const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3940256099942544/1033173712';

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export default function MedicationReminderScreen() {
  const { medicationId, doseId } = useLocalSearchParams<{
    medicationId: string;
    doseId: string;
  }>();

  const { colors } = useTheme();
  const { t, language } = useSettingsStore();
  const { medications, decrementInventory } = useMedicationStore();
  const { addEvent } = useEventLogStore();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isAdShowing, setIsAdShowing] = useState(false);

  const medication = medications.find(m => m.id === medicationId);
  const dose = medication?.doses.find(d => d.id === doseId);

  const styles = createStyles(colors, medication?.color || colors.secondary);

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setIsAdLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setIsAdLoaded(false);
      setIsAdShowing(false);
      // Finalize snooze after ad is closed
      if (medication && dose) {
        completeSnoozeAction(medication, dose);
      }
      // Reload ad for next time
      interstitial.load();
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.error('AdMob Error:', error);
      setIsAdLoaded(false);
      // If ad fails, just proceed with snooze
      if (isAdShowing && medication && dose) {
        setIsAdShowing(false);
        completeSnoozeAction(medication, dose);
      }
    });

    // Start loading the ad
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [medication, dose, isAdShowing]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return () => backHandler.remove();
  }, []);

  const handleTaken = async () => {
    if (!medication || !dose || isCompleted) return;

    nativeAlarm.stopAlarmService();
    setIsCompleted(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(console.error);

    try {
      // Fire-and-forget async cleanup
      Notifications.cancelScheduledNotificationAsync(`medication_snooze_${medication.id}_${dose.id}`).catch(() => { });

      if (medication.trackInventory && medication.pillsPerDose) {
        decrementInventory(medication.id, medication.pillsPerDose);
      }

      addEvent({
        type: 'medication_taken',
        itemId: medication.id,
        itemName: medication.name,
        details: `${medication.dosage} taken at ${dose.time}${dose.note ? ` - ${dose.note}` : ''}`,
      });

      // Give a moment for the user to see the success message
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.error("Failed to handle 'taken' action:", error);
      Alert.alert(t('errorTitle'), 'An error occurred while logging the dose.');
    } finally {
      router.back();
    }
  };

  const handleSkipped = async () => {
    if (!medication || !dose || isCompleted) return;
    nativeAlarm.stopAlarmService();
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(console.error);

      // Fire-and-forget async cleanup
      Notifications.cancelScheduledNotificationAsync(`medication_snooze_${medication.id}_${dose.id}`).catch(() => { });

      addEvent({
        type: 'medication_skipped',
        itemId: medication.id,
        itemName: medication.name,
        details: `${medication.dosage} skipped at ${dose.time}`,
      });
    } catch (error) {
      console.error("Failed to handle 'skipped' action:", error);
    } finally {
      router.back();
    }
  };

  const completeSnoozeAction = async (medication: Medication, dose: MedicationDose) => {
    addEvent({
      type: 'medication_snoozed',
      itemId: medication.id,
      itemName: medication.name,
      details: 'Snoozed for 10 minutes',
    });

    const notificationContent: Notifications.NotificationContentInput = {
      title: `💊 ${medication.name} (${t('snoozed')})`,
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

    if (Platform.OS === 'android') {
      (notificationContent as any).priority = 'high';
      (notificationContent as any).channelId = 'medications';
    }
    if (Platform.OS === 'ios') {
      (notificationContent as any).interruptionLevel = 'timeSensitive';
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: { type: 'timeInterval', seconds: 10 * 60, repeats: false } as Notifications.NotificationTriggerInput,
      identifier: `medication_snooze_${medication.id}_${dose.id}`
    });

    nativeAlarm.stopAlarmService();
    router.back();
  };

  const handleSnooze = async () => {
    if (!medication || !dose || isCompleted) return;

    if (isAdLoaded) {
      setIsAdShowing(true);
      interstitial.show();
    } else {
      completeSnoozeAction(medication, dose);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    const period = t(hour >= 12 ? 'pm' : 'am');
    let displayHour = hour;

    if (period) {
      displayHour = hour % 12 || 12;
    }

    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period || ''}`.trim();
  };

  if (!medication || !dose) {
    // Attempt to close if the data is gone, e.g. after deletion.
    // Use effect to avoid state updates during render.
    useEffect(() => {
      if (router.canGoBack()) {
        router.back();
      }
    }, []);

    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('loadingMedication')}</Text>
      </View>
    );
  }

  const isLowStock = medication.trackInventory &&
    medication.totalCount !== undefined &&
    medication.lowStockThreshold !== undefined &&
    medication.totalCount <= medication.lowStockThreshold;

  const pillsRemainingText = medication.totalCount !== undefined
    ? t(
      (medication.totalCount === 1) ? 'pillsRemaining_one' : 'pillsRemaining_other',
      { count: medication.totalCount }
    )
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Clock size={24} color="white" />
          <Text style={styles.currentTime}>
            {new Date().toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <Text style={styles.scheduledTime}>
          {t('scheduledFor')} {formatTime(dose.time)}
        </Text>
      </View>

      <View style={styles.medicationContainer}>
        <View style={styles.medicationIcon}>
          {medication.imageUri ? (
            <Image source={{ uri: medication.imageUri }} style={styles.medicationImage} />
          ) : (
            <View style={[styles.iconPlaceholder, { backgroundColor: medication.color }]}>
              <Pill size={48} color="white" />
            </View>
          )}
        </View>

        <Text style={styles.medicationName}>{medication.name}</Text>
        <Text style={styles.dosage}>{medication.dosage} {medication.dosageUnit}</Text>

        {dose.note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>{t('noteLabel')}</Text>
            <Text style={styles.noteText}>{dose.note}</Text>
          </View>
        )}

        {isLowStock && (
          <View style={styles.lowStockWarning}>
            <Text style={styles.lowStockText}>
              ⚠️ {t('lowStockWarning')} {pillsRemainingText}
            </Text>
          </View>
        )}

        {medication.trackInventory && medication.totalCount !== undefined && !isLowStock && (
          <Text style={styles.inventoryText}>{pillsRemainingText}</Text>
        )}

        {isCompleted && (
          <Text style={styles.successText}>✅ {t('medicationTakenSuccess')}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title={t('iTookIt')}
          onPress={handleTaken}
          disabled={isCompleted}
          fullWidth
          style={styles.takenButton}
          leftIcon={<Check size={20} color="white" />}
        />

        <View style={styles.secondaryActions}>
          <Button
            title={t('snooze10min')}
            onPress={handleSnooze}
            variant="outline"
            disabled={isCompleted}
            style={[styles.secondaryButton, { borderColor: 'white' }]}
            textStyle={{ color: 'white' }}
          />

          <Button
            title={t('skip')}
            onPress={handleSkipped}
            variant="outline"
            disabled={isCompleted}
            style={[styles.secondaryButton, { borderColor: 'white' }]}
            textStyle={{ color: 'white' }}
            leftIcon={<X size={16} color="white" />}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any, bgColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bgColor,
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  currentTime: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '600',
    color: 'white',
    marginLeft: theme.spacing.sm,
  },
  scheduledTime: {
    fontSize: theme.typography.fontSizes.md,
    color: 'white',
    opacity: 0.8,
  },
  medicationContainer: {
    backgroundColor: colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  medicationIcon: {
    marginBottom: theme.spacing.lg,
  },
  medicationImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  iconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicationName: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  dosage: {
    fontSize: theme.typography.fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  noteContainer: {
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  noteLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  noteText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
  },
  lowStockWarning: {
    backgroundColor: colors.error + '20',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  lowStockText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  inventoryText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  successText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: theme.spacing.md,
  },
  actions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  takenButton: {
    backgroundColor: colors.success,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  secondaryButton: {
    flex: 1,
  },
  loadingText: {
    fontSize: theme.typography.fontSizes.lg,
    color: 'white',
    textAlign: 'center',
  },
});