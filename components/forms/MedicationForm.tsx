
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import TimePickerButton from '@/components/ui/TimePickerButton';
import { Plus, Image as ImageIcon, Trash2, Save, PlusCircle, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Medication, MedicationDose } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { createDefaultDose, createDefaultMedication } from '@/store/medicationStore';
import { DOSAGE_UNITS } from '@/constants/medicationConstants';
import Select from '@/components/ui/Select';
import { calculateDaysToEmpty } from '@/utils/dateTimeHelpers';
import WeekdaySelector from '../alarms/WeekdaySelector';

interface MedicationFormProps {
  initialMedication: Medication | null;
  onSubmit: (medication: Omit<Medication, 'id'> | Medication) => void;
  onCancel: () => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({ initialMedication, onSubmit, onCancel }) => {
  const [medication, setMedication] = useState<Omit<Medication, 'id'> | Medication>(() =>
    initialMedication || createDefaultMedication()
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [daysToEmpty, setDaysToEmpty] = useState<number | null>(null);

  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const styles = createStyles(colors);

  useEffect(() => {
    if (medication.trackInventory && medication.totalCount && medication.pillsPerDose && medication.doses.length > 0) {
      setDaysToEmpty(calculateDaysToEmpty(medication as Medication));
    } else {
      setDaysToEmpty(null);
    }
  }, [medication.trackInventory, medication.totalCount, medication.pillsPerDose, medication.doses]);


  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!medication.name.trim()) newErrors.name = t('medicationForm.medicationNameRequiredError');
    if (!medication.dosage.trim() || isNaN(parseFloat(medication.dosage)) || parseFloat(medication.dosage) <= 0) newErrors.dosage = t('medicationForm.validDosageRequiredError');
    if (medication.doses.length === 0) newErrors.specificTimes = t('medicationForm.atLeastOneTimeRequiredError');

    medication.doses.forEach((dose, index) => {
      if (!dose.time) newErrors[`dose_${index}`] = t('medicationForm.timeEntryRequiredError', { index: index + 1 });
    });

    if (medication.trackInventory) {
      if (medication.totalCount === undefined || isNaN(medication.totalCount) || medication.totalCount < 0) newErrors.totalCount = t('medicationForm.totalPillsValidError');
      if (medication.pillsPerDose === undefined || isNaN(medication.pillsPerDose) || medication.pillsPerDose <= 0) newErrors.pillsPerDose = t('medicationForm.pillsPerDosePositiveError');
      if (medication.lowStockThreshold === undefined || isNaN(medication.lowStockThreshold) || medication.lowStockThreshold < 0) newErrors.lowStockThreshold = t('medicationForm.lowStockThresholdValidError');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    let medData = { ...medication };

    // Logic to reset totalCount if it has been changed during edit
    if (initialMedication && 'id' in initialMedication) {
      if (initialMedication.totalCount !== medData.totalCount) {
        // The total count was edited, so it becomes the new remaining count.
        // This is implicitly handled since we only have one `totalCount` field.
      }
    }

    onSubmit(medData);
  };

  const handleUpdate = (field: keyof Medication, value: any) => {
    setMedication(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDose = () => {
    const newDose = { ...createDefaultDose(), id: Date.now().toString() };
    handleUpdate('doses', [...medication.doses, newDose]);
  };

  const handleRemoveDose = (doseId: string) => {
    if (medication.doses.length <= 1) {
      setErrors(prev => ({ ...prev, specificTimes: t('medicationForm.atLeastOneTimeRequiredError') }));
      return;
    }
    handleUpdate('doses', medication.doses.filter(d => d.id !== doseId));
  };

  const updateDose = (doseId: string, updatedDose: Partial<MedicationDose>) => {
    handleUpdate('doses', medication.doses.map(d => (d.id === doseId ? { ...d, ...updatedDose } : d)));
  };

  const handleImagePick = async () => {
    Alert.alert(
      t('medicationForm.chooseImageSourceTitle'),
      t('medicationForm.chooseImageSourceMessage'),
      [
        {
          text: t('medicationForm.takePhoto'),
          onPress: async () => {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
              Alert.alert(t('medicationForm.permissionRequiredTitle'), t('medicationForm.cameraAccessMessage'));
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) {
              handleUpdate('imageUri', result.assets[0].uri);
            }
          },
        },
        {
          text: t('medicationForm.chooseFromGallery'),
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
              Alert.alert(t('medicationForm.permissionRequiredTitle'), t('medicationForm.galleryAccessMessage'));
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) {
              handleUpdate('imageUri', result.assets[0].uri);
            }
          },
        },
        {
          text: t('remove'),
          style: "destructive",
          onPress: () => handleUpdate('imageUri', undefined),
        },
        { text: t('cancel'), style: "cancel" },
      ]
    );
  };

  const dosageUnitOptions = DOSAGE_UNITS.map(unit => ({ label: t(`unit_${unit}`), value: unit }));

  return (
    <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
      {/* Name and Image */}
      <Text style={styles.sectionTitle}>{t('medicationDetails')}</Text>
      <View style={styles.imagePickerContainer}>
        <TouchableOpacity onPress={handleImagePick} style={[styles.imagePreview, { backgroundColor: medication.color }]}>
          {medication.imageUri ? (
            <Image source={{ uri: medication.imageUri }} style={styles.imageStyle} resizeMode="cover" />
          ) : (
            <Camera size={40} color={'white'} />
          )}
        </TouchableOpacity>
        <Button
          onPress={handleImagePick}
          variant="outline"
          size="sm"
          title={medication.imageUri ? t('medicationForm.changeRemoveImageButton') : t('medicationForm.chooseImageButton')}
        />
      </View>
      <Input
        label={t('medicationForm.medicationNameLabel')}
        value={medication.name}
        onChangeText={(v) => handleUpdate('name', v)}
        placeholder={t('medicationNamePlaceholder')}
        error={errors.name}
      />

      {/* Dosage */}
      <View style={styles.row}>
        <Input
          containerStyle={{ flex: 1, marginRight: 8 }}
          label={t('medicationForm.dosageLabel')}
          value={medication.dosage}
          onChangeText={(v) => handleUpdate('dosage', v)}
          placeholder={"1"}
          keyboardType="numeric"
          error={errors.dosage}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('medicationForm.unitLabel')}</Text>
          <Select
            options={dosageUnitOptions}
            value={medication.dosageUnit}
            onValueChange={(v) => handleUpdate('dosageUnit', v)}
          />
        </View>
      </View>

      {/* Schedule and Doses */}
      <Text style={[styles.sectionTitle]}>{t('dosingSchedule')}</Text>
      <Input
        label={t('medicationForm.generalScheduleTextLabel')}
        value={medication.scheduleText}
        onChangeText={(v) => handleUpdate('scheduleText', v)}
        placeholder={t('medicationForm.generalScheduleTextPlaceholder')}
      />

      {medication.doses.map((dose, index) => (
        <View key={dose.id} style={[styles.doseContainer, { borderLeftColor: medication.color || colors.primary }]}>
          <View style={styles.doseHeader}>
            <Text style={styles.doseTitle}>{t('doseNumbered', { number: index + 1 })}</Text>
            {medication.doses.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveDose(dose.id)}>
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
          <TimePickerButton
            label={t('alarmForm.timeLabel')}
            value={dose.time}
            onChange={(newTime) => updateDose(dose.id, { ...dose, time: newTime })}
          />
          {errors[`dose_${index}`] && <Text style={styles.errorText}>{errors[`dose_${index}`]}</Text>}

          <WeekdaySelector
            label={t('alarmForm.repeatOnDaysLabel')}
            selectedDays={dose.days}
            onDayToggle={(dayIndex) => {
              const newDays = [...dose.days];
              newDays[dayIndex] = !newDays[dayIndex];
              updateDose(dose.id, { days: newDays });
            }}
          />

          <Input
            containerStyle={{ marginTop: 8 }}
            value={dose.note || ''}
            onChangeText={(newNote) => updateDose(dose.id, { ...dose, note: newNote })}
            placeholder={t('medicationForm.noteForThisTimeOptionalLabel')}
          />
        </View>
      ))}
      {errors.specificTimes && <Text style={styles.errorText}>{errors.specificTimes}</Text>}
      <Button onPress={handleAddDose} variant='outline' title={t('medicationForm.addTimeNoteButton')} leftIcon={<Plus size={16} color={colors.primary} />} />

      {/* Inventory Tracking */}
      <Text style={[styles.sectionTitle]}>{t('inventoryTracking')}</Text>
      <View style={styles.switchRow}>
        <Text style={styles.label}>{t('medicationForm.enableInventoryTrackingLabel')}</Text>
        <Switch value={medication.trackInventory} onValueChange={(v) => handleUpdate('trackInventory', v)} />
      </View>

      {medication.trackInventory && (
        <View>
          <View style={styles.row}>
            <Input
              containerStyle={{ flex: 1, marginRight: 8 }}
              label={t('medicationForm.totalPillsUnitsLabel')}
              value={medication.totalCount?.toString() || ''}
              onChangeText={(v) => handleUpdate('totalCount', v ? parseInt(v, 10) : 0)}
              keyboardType="numeric"
              error={errors.totalCount}
            />
            <Input
              containerStyle={{ flex: 1 }}
              label={t('medicationForm.pillsUnitsPerDoseLabel')}
              value={medication.pillsPerDose?.toString() || ''}
              onChangeText={(v) => handleUpdate('pillsPerDose', v ? parseInt(v, 10) : 1)}
              keyboardType="numeric"
              error={errors.pillsPerDose}
            />
          </View>
          <Input
            label={t('medicationForm.lowStockThresholdLabel')}
            value={medication.lowStockThreshold?.toString() || ''}
            onChangeText={(v) => handleUpdate('lowStockThreshold', v ? parseInt(v, 10) : 0)}
            keyboardType="numeric"
            error={errors.lowStockThreshold}
          />
          {daysToEmpty !== null && (
            <Text style={styles.daysToEmptyText}>{t('medicationForm.estimatedDaysToEmptyText', { days: daysToEmpty })}</Text>
          )}
        </View>
      )}

      {/* Notes and Reminders */}
      <Text style={[styles.sectionTitle]}>{t('options')}</Text>
      <Input
        label={t('medicationForm.generalInstructionsNotesLabel')}
        value={medication.notes}
        onChangeText={(v) => handleUpdate('notes', v)}
        placeholder={t('medicationForm.generalInstructionsNotesPlaceholder')}
        multiline
        inputStyle={{ height: 80, textAlignVertical: 'top' }}
      />
      <View style={styles.switchRow}>
        <Text style={styles.label}>{t('medicationForm.enableRefillReminderLabel')}</Text>
        <Switch
          value={medication.refillReminderEnabled ?? false}
          onValueChange={(v) => handleUpdate('refillReminderEnabled', v)}
          disabled={!medication.trackInventory}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button variant="outline" onPress={onCancel} title={t('cancel')} style={{ flex: 1 }} />
        <Button variant="primary" onPress={handleSubmit} title={initialMedication ? t('saveChanges') : t('addMedication')} style={{ flex: 1 }} leftIcon={<Save size={18} color="white" />} />
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  formContainer: { flex: 1 },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: theme.spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: colors.card,
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  label: { fontSize: 14, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.xs
  },
  doseContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  doseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  doseTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600',
    color: colors.text
  },
  daysToEmptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: -theme.spacing.sm,
    textAlign: 'right',
    marginBottom: theme.spacing.sm,
  }
});

export default MedicationForm;
