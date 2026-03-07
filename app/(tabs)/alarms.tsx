
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { useAlarmStore } from '@/store/alarmStore';
import AlarmListItem from '@/components/alarms/AlarmListItem';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import AlarmPermissionHelper from '@/components/AlarmPermissionHelper';
import { Bell } from 'lucide-react-native';
import { Alarm } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { router } from 'expo-router';
import AdBanner from '@/components/ui/AdBanner';

export default function AlarmsScreen() {
  const { alarms, addAlarm, updateAlarm, deleteAlarm } = useAlarmStore();
  const { colors } = useTheme();
  const { t } = useSettingsStore();

  const handleOpenForm = (alarmId?: string) => {
    router.push({
      pathname: '/alarm-form' as any,
      params: { id: alarmId }
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const getActiveAlarmsText = () => {
    const activeAlarmsCount = alarms.filter(a => a.isEnabled).length;
    if (activeAlarmsCount === 0) {
      return t('noActiveAlarms');
    }
    const key = activeAlarmsCount === 1 ? 'activeAlarms_one' : 'activeAlarms_other';
    return t(key, { count: activeAlarmsCount });
  };


  const renderItem = ({ item }: { item: Alarm }) => (
    <AlarmListItem alarm={item} onPress={() => handleOpenForm(item.id)} />
  );

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: theme.spacing.md }}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{getGreeting()}</Text>
          <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit>{getActiveAlarmsText()}</Text>
        </View>
        <Button
          title={t('newAlarm')}
          onPress={() => handleOpenForm()}
          variant="primary"
          size="md"
          style={{ minWidth: 100 }}
        />
      </View>

      <AlarmPermissionHelper />

      {alarms.length > 0 ? (
        <FlatList
          data={alarms}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          title={t('noAlarmsSet')}
          description={t('noAlarmsDescription')}
          icon={<Bell size={48} color={colors.primary} />}
          actionLabel={t('addAlarm')}
          onAction={() => handleOpenForm()}
          style={styles.emptyState}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: theme.typography.fontWeights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 160,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
  },
});