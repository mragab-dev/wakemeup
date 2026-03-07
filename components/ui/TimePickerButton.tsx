import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  Modal,
  View,
  ScrollView
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { Clock, X, Check } from 'lucide-react-native';
import Button from './Button';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/settingsStore';

interface TimePickerButtonProps {
  value: string;
  onChange: (time: string) => void;
  style?: ViewStyle;
  label?: string;
}

export const TimePickerButton: React.FC<TimePickerButtonProps> = ({
  value,
  onChange,
  style,
  label,
}) => {
  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(() => {
    const [hours] = value.split(':');
    return parseInt(hours, 10);
  });
  const [selectedMinute, setSelectedMinute] = useState(() => {
    const [, minutes] = value.split(':');
    return parseInt(minutes, 10);
  });

  const styles = createStyles(colors);

  const handlePress = () => {
    Haptics.selectionAsync();
    // Reset to current value when opening
    const [hours, minutes] = value.split(':');
    setSelectedHour(parseInt(hours, 10));
    setSelectedMinute(parseInt(minutes, 10));
    setShowPicker(true);
  };

  const handleConfirm = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onChange(timeString);
    setShowPicker(false);
  };

  const handleCancel = () => {
    // Reset to current value
    const [hours, minutes] = value.split(':');
    setSelectedHour(parseInt(hours, 10));
    setSelectedMinute(parseInt(minutes, 10));
    setShowPicker(false);
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

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Clock size={20} color={colors.primary} />
        <Text style={styles.timeText}>{formatTime(value)}</Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel} style={styles.modalButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>{t('selectTime')}</Text>

              <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
                <Check size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>{t('hour')}</Text>
                <ScrollView
                  style={styles.picker}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContent}
                  contentOffset={{ x: 0, y: selectedHour * 44 - 88 }}
                >
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        selectedHour === hour && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedHour(hour);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedHour === hour && styles.pickerItemTextSelected,
                        ]}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.separator}>:</Text>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>{t('minute')}</Text>
                <ScrollView
                  style={styles.picker}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContent}
                  contentOffset={{ x: 0, y: selectedMinute * 44 - 88 }}
                >
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        selectedMinute === minute && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedMinute(minute);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMinute === minute && styles.pickerItemTextSelected,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title={t('cancel')}
                onPress={handleCancel}
                variant="outline"
                style={styles.actionButton}
              />

              <Button
                title={t('confirm')}
                onPress={handleConfirm}
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '500',
    color: colors.text,
    marginBottom: theme.spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    height: 44,
    gap: theme.spacing.sm,
  },
  timeText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalButton: {
    padding: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  picker: {
    height: 200,
    width: '100%',
  },
  pickerContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  pickerItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginVertical: 2,
    minWidth: 60,
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: colors.primary,
  },
  pickerItemText: {
    fontSize: theme.typography.fontSizes.lg,
    color: colors.text,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  separator: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default TimePickerButton;
