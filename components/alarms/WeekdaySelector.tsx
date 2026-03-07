
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';
import theme from '@/constants/theme';

interface WeekdaySelectorProps {
  selectedDays: boolean[];
  onDayToggle: (dayIndex: number) => void;
  label: string;
}

const WeekdaySelector: React.FC<WeekdaySelectorProps> = ({ selectedDays, onDayToggle, label }) => {
  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const styles = createStyles(colors);
  
  // Sunday is index 0, Monday is 1, etc.
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.daysContainer}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDays[index] && styles.dayButtonSelected,
            ]}
            onPress={() => onDayToggle(index)}
          >
            <Text style={[styles.dayText, selectedDays[index] && styles.dayTextSelected]}>
              {t(day).charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dayTextSelected: {
    color: 'white',
  },
});

export default WeekdaySelector;
