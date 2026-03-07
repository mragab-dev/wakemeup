

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '@/constants/theme';
import { Alarm, ChallengeType } from '@/types';
import Switch from '@/components/ui/Switch';
import { useAlarmStore } from '@/store/alarmStore';
import { Bell, Trash2 } from 'lucide-react-native';
import { Alert } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';

interface AlarmListItemProps {
  alarm: Alarm;
  onPress: (alarm: Alarm) => void;
}

export const AlarmListItem: React.FC<AlarmListItemProps> = ({ alarm, onPress }) => {
  const { toggleAlarmEnabled, deleteAlarm } = useAlarmStore();
  const { t } = useSettingsStore();
  const { colors } = useTheme();

  const handleDelete = () => {
    Alert.alert(
      t('deleteAlarm'),
      t('deleteAlarmConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteAlarm(alarm.id);
          }
        },
      ]
    );
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    const period = t('pm') && t('am') ? (hour >= 12 ? t('pm') : t('am')) : '';
    let displayHour = hour;

    if (period) {
      displayHour = hour % 12 || 12;
    }

    return {
      hour: displayHour.toString(),
      minute: minute.toString().padStart(2, '0'),
      period,
    };
  };

  const { hour, minute, period } = formatTime(alarm.time);

  const getDaysText = () => {
    const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const selectedDays = alarm.days
      .map((isSelected, index) => (isSelected ? daysOfWeek[index] : null))
      .filter(Boolean);

    if (selectedDays.length === 7) return t('everyday');
    if (selectedDays.length === 0) return t('once');
    if (selectedDays.length === 5 && !selectedDays.includes('sun') && !selectedDays.includes('sat')) return t('weekdays');
    if (selectedDays.length === 2 && selectedDays.includes('sun') && selectedDays.includes('sat')) return t('weekends');

    return selectedDays.map(day => t(day as string)).join(', ');
  };

  const styles = createStyles(colors, alarm.isEnabled);
  const challengeText = t('challengeSummary_' + alarm.challenge.type)

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(alarm)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Bell size={24} color={alarm.isEnabled ? colors.primary : colors.textSecondary} />
      </View>

      <View style={styles.content}>
        <View style={styles.timeContainer}>
          <Text style={styles.hour}>
            {hour}:{minute}
          </Text>
          {period ? <Text style={styles.period}>{period}</Text> : null}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {alarm.name}
          </Text>
          <Text style={styles.days} numberOfLines={1}>
            {getDaysText()}
          </Text>

          {alarm.challenge.type !== ChallengeType.NONE && (
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeText}>
                {challengeText}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteButton}
          activeOpacity={0.6}
        >
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
        <Switch
          value={alarm.isEnabled}
          onValueChange={() => toggleAlarmEnabled(alarm.id)}
        />
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any, enabled: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    opacity: enabled ? 1 : 0.7,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hour: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700',
    color: enabled ? colors.text : colors.textSecondary,
  },
  period: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
  name: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500',
    color: enabled ? colors.text : colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  days: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  challengeBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginLeft: theme.spacing.sm,
    marginTop: 4,
  },
  challengeText: {
    fontSize: theme.typography.fontSizes.xs,
    color: 'white',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
});

export default AlarmListItem;
