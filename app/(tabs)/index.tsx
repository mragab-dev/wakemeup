import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { useAlarmStore } from '@/store/alarmStore';
import { useMedicationStore } from '@/store/medicationStore';
import { useEventLogStore } from '@/store/eventLogStore';
import UpcomingCard from '@/components/dashboard/UpcomingCard';
import StatsCard from '@/components/dashboard/StatsCard';
import Button from '@/components/ui/Button';
import AdBanner from '@/components/ui/AdBanner';
import { Plus, Bell, Pill } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { ChallengeType } from '@/types';

interface UpcomingItem {
  type: 'alarm' | 'medication';
  name: string;
  time: string;
  details?: string;
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const { alarms } = useAlarmStore();
  const { medications, setIsCreatingNewMedication } = useMedicationStore();
  const { events } = useEventLogStore();

  // Get upcoming alarms and medications
  const getUpcomingItems = (): UpcomingItem[] => {
    const upcomingItems: UpcomingItem[] = [];

    // Add enabled alarms
    alarms
      .filter(alarm => alarm.isEnabled)
      .slice(0, 2)
      .forEach(alarm => {
        upcomingItems.push({
          type: 'alarm',
          name: alarm.name,
          time: alarm.time,
          details: alarm.challenge.type !== ChallengeType.NONE
            ? t(alarm.challenge.type + 'Challenge')
            : undefined,
        });
      });

    // Add medications with upcoming doses
    medications.slice(0, 2).forEach(medication => {
      if (medication.doses.length > 0) {
        upcomingItems.push({
          type: 'medication',
          name: medication.name,
          time: medication.doses[0].time,
          details: `${medication.dosage} ${medication.dosageUnit}`,
        });
      }
    });

    // Sort by time
    return upcomingItems.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);

      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      }

      return timeA[1] - timeB[1];
    }).slice(0, 3); // Show at most 3 items
  };

  // Calculate stats
  const getAlarmStats = () => {
    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const alarmEvents = events.filter(
      event => event.timestamp >= last7Days && event.type.startsWith('alarm_')
    );

    const triggered = alarmEvents.filter(event => event.type === 'alarm_triggered').length;
    const snoozed = alarmEvents.filter(event => event.type === 'alarm_snoozed').length;
    const dismissed = alarmEvents.filter(event => event.type === 'alarm_dismissed').length;

    return [
      { label: t('triggered'), value: triggered, color: colors.primary },
      { label: t('snoozed'), value: snoozed, color: colors.warning },
      { label: t('dismissed'), value: dismissed, color: colors.success },
    ];
  };

  const getMedicationStats = () => {
    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const medEvents = events.filter(
      event => event.timestamp >= last7Days &&
        (event.type === 'medication_taken' ||
          event.type === 'medication_skipped')
    );

    const taken = medEvents.filter(event => event.type === 'medication_taken').length;
    const skipped = medEvents.filter(event => event.type === 'medication_skipped').length;
    const totalDoses = taken + skipped;
    const adherenceRate = totalDoses > 0
      ? Math.round((taken / totalDoses) * 100)
      : 0;

    return [
      { label: t('taken'), value: taken, color: colors.success },
      { label: t('skipped'), value: skipped, color: colors.error },
      { label: t('adherence'), value: `${adherenceRate}%`, color: colors.info },
    ];
  };

  const handleNewMedication = () => {
    setIsCreatingNewMedication(true);
    router.push('/medications');
  };

  const upcomingItems = getUpcomingItems();
  const alarmStats = getAlarmStats();
  const medicationStats = getMedicationStats();
  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('wakeUpTitle')}</Text>
        <Text style={styles.subtitle}>{t('wakeUpSubtitle')}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('comingUp')}</Text>
        </View>

        {upcomingItems.length > 0 ? (
          upcomingItems.map((item, index) => (
            <UpcomingCard key={index} item={item} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('noUpcoming')}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        </View>

        <View style={styles.quickActions}>
          <Button
            title={t('newAlarm')}
            onPress={() => router.push('/alarms')}
            variant="outline"
            style={styles.quickActionButton}
            leftIcon={<Bell size={18} color={colors.primary} />}
          />

          <Button
            title={t('newMedication')}
            onPress={handleNewMedication}
            variant="outline"
            style={styles.quickActionButton}
            leftIcon={<Pill size={18} color={colors.secondary} />}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('weeklyStats')}</Text>
        </View>

        <StatsCard title={t('alarmActivity')} stats={alarmStats} />
        <StatsCard title={t('medicationAdherence')} stats={medicationStats} />
      </View>


    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 160, // Account for Tab bar + Ad banner
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxxl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    padding: theme.spacing.lg,
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
  },
});
