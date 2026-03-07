import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Alarm, Challenge, ChallengeType, SnoozeSettings, MathChallengeConfig, WordPuzzleConfig, QRScanConfig, ChallengeConfig } from '@/types';
import { SNOOZE_DURATIONS_MINUTES, MAX_SNOOZE_COUNTS, CHALLENGE_DIFFICULTY_LEVELS, MATH_CHALLENGE_QUESTIONS_COUNT, WORD_PUZZLE_DIFFICULTY_LEVELS } from '@/constants/alarmConstants';
import { soundOptions } from '@/constants/sounds';
import Button from '../ui/Button';
import { PlusCircle, Save, Camera, ChevronRight, Trash2 } from 'lucide-react-native';
import TimePickerButton from '../ui/TimePickerButton';
import WeekdaySelector from '../alarms/WeekdaySelector';
import Select from '../ui/Select';
import Switch from '../ui/Switch';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';
import theme from '@/constants/theme';
import { createDefaultAlarm } from '@/store/alarmStore';
import SoundPicker from '../alarms/SoundPicker';
import { router, useLocalSearchParams } from 'expo-router';
import ChallengeSelector from '../alarms/ChallengeSelector';
import nativeAlarm from '@/utils/nativeAlarm';

interface AlarmFormProps {
  initialAlarm?: Alarm | null;
  onSubmit: (alarm: Omit<Alarm, 'id'> | Alarm) => void;
  onCancel: () => void;
}

const AlarmForm: React.FC<AlarmFormProps> = ({ initialAlarm, onSubmit, onCancel }) => {
  const [alarm, setAlarm] = useState(() => initialAlarm || createDefaultAlarm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSoundPickerVisible, setSoundPickerVisible] = useState(false);

  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const styles = createStyles(colors);

  // Sync internal state with initialAlarm when it changes
  useEffect(() => {
    if (initialAlarm) {
      setAlarm(initialAlarm);
    }
  }, [initialAlarm]);

  const params = useLocalSearchParams();

  // Effect to update QR code value when returning from scanner
  useEffect(() => {
    if (params.scannedData && typeof params.scannedData === 'string' && alarm.challenge.type === ChallengeType.QR_SCAN) {
      updateChallengeConfig('targetValue', params.scannedData);
      // Clean the param to avoid re-triggering
      router.setParams({ scannedData: '' });
    }
  }, [params.scannedData]);

  const updateAlarmState = (field: keyof Omit<Alarm, 'id'>, value: any) => {
    setAlarm(prev => ({ ...prev, [field]: value }));
  };

  const updateChallenge = (field: keyof Challenge, value: any) => {
    updateAlarmState('challenge', { ...alarm.challenge, [field]: value });
  };

  const updateChallengeConfig = (field: string, value: any) => {
    const newConfig = { ...alarm.challenge.config, [field]: value };
    updateChallenge('config', newConfig);
  };

  const updateSnooze = (field: keyof SnoozeSettings, value: any) => {
    updateAlarmState('snooze', { ...alarm.snooze, [field]: value });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!alarm.name.trim()) newErrors.name = t('alarmForm.alarmNamePlaceholder');
    if (alarm.challenge.type === ChallengeType.QR_SCAN && !(alarm.challenge.config as QRScanConfig)?.targetValue?.trim()) {
      newErrors.qrTargetValue = t('alarmForm.qrCodeTargetValuePlaceholder');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(alarm);
  };

  const handleDelete = () => {
    if (!initialAlarm || !('id' in initialAlarm)) return;

    Alert.alert(
      t('deleteAlarm'),
      t('deleteAlarmConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            const { useAlarmStore: store } = require('@/store/alarmStore');
            store.getState().deleteAlarm(initialAlarm.id);
            // Ensure no active ringing continues for this alarm
            nativeAlarm.stopAlarmService();
            router.back();
          }
        },
      ]
    );
  };

  const handleChallengeTypeChange = (newType: ChallengeType) => {
    let config: ChallengeConfig = null;
    if (newType === ChallengeType.MATH) config = { difficulty: 2, questions: 3 };
    if (newType === ChallengeType.WORD_PUZZLE) config = { difficulty: 2 };
    if (newType === ChallengeType.QR_SCAN) config = { targetValue: '' };
    updateAlarmState('challenge', { type: newType, config });
  };

  const openQRScanner = () => {
    router.push({
      pathname: '/qr-scanner',
      params: { returnPath: '/alarms' } // The modal is on the alarms tab
    });
  };

  const showRepeatSwitch = alarm.days.some(d => d);
  const currentSoundName = t(soundOptions.find(s => s.value === alarm.sound)?.name as any || 'sound_default');
  const snoozeDurationOptions = SNOOZE_DURATIONS_MINUTES.map(d => ({ label: t('snoozeDurationMinutes', { count: d }), value: d.toString() }));
  const snoozeMaxCountOptions = MAX_SNOOZE_COUNTS.map(c => ({ label: t('activeAlarms_other', { count: c }).replace(/.*(\d+).*/, '$1') || c.toString(), value: c.toString() }));
  // Standardizing labels for snooze count
  const snoozeMaxCountOptionsFixed = MAX_SNOOZE_COUNTS.map(c => ({ label: `${c} ${t('snoozeMaxCountTimes', { count: c }).replace(/\d+/, '').trim()}`, value: c.toString() }));

  return (
    <>
      <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
        {/* Basic Details */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('alarmForm.alarmNameLabel')}</Text>
          <TextInput style={styles.input} value={alarm.name} onChangeText={(v) => updateAlarmState('name', v)} placeholder={t('alarmForm.alarmNamePlaceholder')} placeholderTextColor={colors.textSecondary} />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <TimePickerButton label={t('alarmForm.timeLabel')} value={alarm.time} onChange={(v) => updateAlarmState('time', v)} />
        <WeekdaySelector label={t('alarmForm.repeatOnDaysLabel')} selectedDays={alarm.days} onDayToggle={(i) => updateAlarmState('days', alarm.days.map((d, idx) => (idx === i ? !d : d)))} />

        {showRepeatSwitch && (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('repeatWeekly')}</Text>
            <Switch value={alarm.repeats} onValueChange={(v) => updateAlarmState('repeats', v)} />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('alarmForm.alarmSoundLabel')}</Text>
          <TouchableOpacity style={styles.selectorButton} onPress={() => setSoundPickerVisible(true)}>
            <Text style={styles.selectorButtonText}>{currentSoundName}</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ChallengeSelector
          selectedType={alarm.challenge.type}
          onTypeChange={handleChallengeTypeChange}
          selectedDifficulty={
            (alarm.challenge.config as MathChallengeConfig)?.difficulty >= 5 ? 'hard' :
              (alarm.challenge.config as MathChallengeConfig)?.difficulty >= 3 ? 'medium' : 'easy'
          }
          onDifficultyChange={(difficulty) => {
            const levelMap = { 'easy': 2, 'medium': 4, 'hard': 5 };
            updateChallengeConfig('difficulty', levelMap[difficulty]);
          }}
          questionCount={(alarm.challenge.config as MathChallengeConfig)?.questions || 1}
          onQuestionCountChange={(count) => updateChallengeConfig('questions', count)}
        />

        {alarm.challenge.type === ChallengeType.QR_SCAN && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('alarmForm.qrCodeTargetValueLabel')}</Text>
            <View style={styles.qrInputContainer}>
              <TextInput
                style={[styles.input, styles.qrInput]}
                value={(alarm.challenge.config as QRScanConfig)?.targetValue || ''}
                onChangeText={(v) => updateChallengeConfig('targetValue', v)}
                placeholder={t('alarmForm.qrCodeTargetValuePlaceholder')}
                placeholderTextColor={colors.textSecondary}
              />
              <Button
                onPress={openQRScanner}
                variant="secondary"
                style={styles.qrScanButton}
                leftIcon={<Camera size={20} color={'white'} />}
              />
            </View>
            {errors.qrTargetValue && <Text style={styles.errorText}>{errors.qrTargetValue}</Text>}
          </View>
        )}


        {/* Snooze Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('alarmForm.snoozeSettingsLabel')}</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('alarmForm.enableSnoozeLabel')}</Text>
            <Switch value={alarm.snooze.enabled} onValueChange={(v) => updateSnooze('enabled', v)} />
          </View>
          {alarm.snooze.enabled && (
            <>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>{t('alarmForm.snoozeDurationLabel')}</Text>
                  <Select options={snoozeDurationOptions} value={alarm.snooze.durationMinutes.toString()} onValueChange={(v) => updateSnooze('durationMinutes', Number(v))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t('alarmForm.maxSnoozeCountLabel')}</Text>
                  <Select options={snoozeMaxCountOptionsFixed} value={alarm.snooze.maxCount.toString()} onValueChange={(v) => updateSnooze('maxCount', Number(v))} />
                </View>
              </View>
              <View style={styles.switchRow}>
                <View style={styles.labelContainer}>
                  <Text style={styles.switchLabel}>{t('alarmForm.enableMustGetUpLabel')}</Text>
                  <Text style={styles.switchDescription}>{t('alarmForm.mustGetUpDescription')}</Text>
                </View>
                <Switch value={alarm.snooze.mustGetUpModeEnabled} onValueChange={(v) => updateSnooze('mustGetUpModeEnabled', v)} />
              </View>
              {alarm.snooze.mustGetUpModeEnabled && (
                <View style={styles.switchRow}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.switchLabel}>{t('alarmForm.forceMaxDifficultyMGU_Label')}</Text>
                    <Text style={styles.switchDescription}>{t('alarmForm.forceMaxDifficultyMGU_Description')}</Text>
                  </View>
                  <Switch value={alarm.snooze.mustGetUpForceMaxDifficulty} onValueChange={(v) => updateSnooze('mustGetUpForceMaxDifficulty', v)} />
                </View>
              )}
            </>
          )}
        </View>

        {/* Enable/Disable */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>{t('alarmForm.enableThisAlarmLabel')}</Text>
          <Switch value={alarm.isEnabled} onValueChange={(v) => updateAlarmState('isEnabled', v)} />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {initialAlarm && (
            <Button
              variant="outline"
              onPress={handleDelete}
              title={t('delete')}
              style={[styles.formButton, { borderColor: colors.error }]}
              textStyle={{ color: colors.error }}
              leftIcon={<Trash2 size={18} color={colors.error} />}
            />
          )}
          <Button variant="outline" onPress={onCancel} title={t('cancel')} style={styles.formButton} />
          <Button variant="primary" onPress={handleSubmit} title={initialAlarm ? t('alarmForm.saveChangesButton') : t('alarmForm.addAlarmButton')} style={styles.formButton} leftIcon={initialAlarm ? <Save size={18} color={'white'} /> : <PlusCircle size={18} color={'white'} />} />
        </View>
      </ScrollView>

      <SoundPicker
        isVisible={isSoundPickerVisible}
        onClose={() => setSoundPickerVisible(false)}
        onSelect={(sound) => updateAlarmState('sound', sound)}
        currentSound={alarm.sound}
      />
    </>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  formContainer: { paddingBottom: 20 },
  inputGroup: {
    marginBottom: 18,
  },
  label: { fontSize: 14, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: colors.card, color: colors.text, paddingHorizontal: 12, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: colors.border, fontSize: 16, minHeight: 44, },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  qrInputContainer: { flexDirection: 'row', alignItems: 'center', },
  qrInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  qrScanButton: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, height: 44 },
  section: {
    marginVertical: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, },
  labelContainer: { flex: 1, marginRight: theme.spacing.md },
  switchLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  switchDescription: { fontSize: 11, color: colors.textSecondary, fontWeight: 'normal', marginTop: 2 },
  buttonContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 25, paddingTop: 15, borderTopWidth: 1, borderColor: colors.border, gap: theme.spacing.sm },
  formButton: { flex: 1, minWidth: 140 },
  errorText: { color: colors.error, fontSize: 12, marginTop: 4, marginBottom: 10 },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    color: colors.text,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
    paddingVertical: theme.spacing.xs,
  },
  selectorButtonText: {
    color: colors.text,
    fontSize: 16,
  },
});

export default AlarmForm;