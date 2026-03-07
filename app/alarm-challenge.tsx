import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler, Platform, Keyboard } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useAlarmStore } from '@/store/alarmStore';
import { useEventLogStore } from '@/store/eventLogStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Bell, Calculator, FileText, QrCode, Camera, Check, Video as VideoIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '@/store/settingsStore';
import { ChallengeType, MathChallengeConfig, WordPuzzleConfig, QRScanConfig, Alarm } from '@/types';
import { generateMathProblems, generateWordPuzzles } from '@/utils/challengeHelpers';
import { getSoundAsset } from '@/constants/sounds';
import { CHALLENGE_DIFFICULTY_LEVELS } from '@/constants/alarmConstants';
import { InterstitialAd, AdEventType, TestIds } from '@/utils/adMob';
import { NativeModules } from 'react-native';
import nativeAlarm from '@/utils/nativeAlarm';

const { AlarmModule, IntentModule } = NativeModules;

// AdMob Interstitial Ad Unit ID (using Test ID for now)
const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3940256099942544/1033173712';

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

interface MathChallengeProblem {
  question: string;
  answer: string;
}

interface WordChallengeProblem {
  question: string;
  answer: string;
  scrambled: string;
  hint: string;
}

interface QRChallengeProblem {
  question: string;
  answer: string;
  instruction: string;
}

type ChallengeProblem = MathChallengeProblem | WordChallengeProblem | QRChallengeProblem;

export default function AlarmChallengeScreen() {
  const { alarmId, challengeType, scannedData, snoozeCount: snoozeCountStr } = useLocalSearchParams<{
    alarmId: string;
    challengeType: string;
    scannedData?: string;
    snoozeCount?: string;
  }>();

  const snoozeCount = parseInt(snoozeCountStr || '0', 10);

  const { colors } = useTheme();
  const { t, language } = useSettingsStore();
  const { alarms, updateAlarm } = useAlarmStore();
  const { addEvent } = useEventLogStore();

  const [params, setParams] = useState<{
    alarmId?: string;
    challengeType?: string;
    snoozeCount?: number;
  }>({
    alarmId: alarmId,
    challengeType: challengeType,
    snoozeCount: parseInt(snoozeCountStr || '0', 10)
  });

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [challenge, setChallenge] = useState<ChallengeProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isAdShowing, setIsAdShowing] = useState(false);

  // Strip suffixes like _day_N or _snooze from alarmId for lookup
  const cleanAlarmId = params.alarmId?.split('_')[0];
  const alarm = alarms.find(a => a.id === cleanAlarmId);
  const styles = createStyles(colors);

  useEffect(() => {
    return () => {
      nativeAlarm.stopAlarmService();
    };
  }, []);

  // Sync params with local search params (initial mount)
  useEffect(() => {
    if (alarmId) {
      setParams(prev => ({ ...prev, alarmId, challengeType, snoozeCount: parseInt(snoozeCountStr || '0', 10) }));
    }
  }, [alarmId, challengeType, snoozeCountStr]);

  // Fallback to IntentModule if params are missing (common on cold start from native)
  useEffect(() => {
    const checkIntent = async () => {
      if (!params.alarmId && Platform.OS === 'android' && IntentModule) {
        try {
          const extras = await IntentModule.getIntentExtras();
          if (extras?.alarmId) {
            console.log("Found alarm params in intent backup:", extras);
            setParams({
              alarmId: extras.alarmId,
              challengeType: extras.challengeType || 'none',
              snoozeCount: extras.snoozeCount || 0
            });
          }
        } catch (e) { console.error("Intent fallback failed:", e); }
      }
    };
    checkIntent();
  }, [params.alarmId]);

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setIsAdLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setIsAdLoaded(false);
      setIsAdShowing(false);
      // Finalize snooze after ad is closed (scheduling already done)
      finalizeSnoozeAndExit();
      // Reload ad for next time
      interstitial.load();
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.error('AdMob Error:', error);
      setIsAdLoaded(false);
      // If ad fails, just proceed with finalize
      if (isAdShowing) {
        setIsAdShowing(false);
        finalizeSnoozeAndExit();
      }
    });

    // Start loading the ad
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [alarm, isAdShowing]);

  const performSnoozeScheduling = (alarm: Alarm) => {
    addEvent({
      type: 'alarm_snoozed',
      itemId: alarm.id,
      itemName: alarm.name,
      details: `Snoozed for ${alarm.snooze.durationMinutes} minutes. Snooze ${snoozeCount + 1}/${alarm.snooze.maxCount}.`,
    });

    const snoozeTime = Date.now() + alarm.snooze.durationMinutes * 60 * 1000;

    if (Platform.OS === 'android') {
      nativeAlarm.scheduleAlarm(`${alarm.id}_snooze`, `${alarm.name} (${t('snoozed')})`, alarm.challenge.type, alarm.sound, 'alarm', snoozeTime);
    } else {
      const notificationContent: Notifications.NotificationContentInput = {
        title: `🚨 ${alarm.name} (${t('snoozed')})`,
        body: alarm.challenge.type !== ChallengeType.NONE
          ? `Wake up! Complete the ${alarm.challenge.type} challenge to dismiss.`
          : 'Time to wake up! Tap to dismiss.',
        sound: false,
        vibrate: [0, 250, 250, 250],
        data: {
          alarmId: alarm.id,
          type: 'alarm',
          challengeType: alarm.challenge.type,
          autoOpen: true,
          snoozeCount: params.snoozeCount! + 1
        },
        sticky: true,
        autoDismiss: false,
      };

      Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          type: 'timeInterval',
          seconds: alarm.snooze.durationMinutes * 60,
          repeats: false
        } as Notifications.NotificationTriggerInput,
        identifier: `${alarm.id}_snooze`,
      });
    }
    console.log('Snooze scheduled in background');
  };

  const finalizeSnoozeAndExit = () => {
    nativeAlarm.stopAlarmService();
    router.replace('/(tabs)');
  };

  const totalQuestions = params.challengeType === ChallengeType.MATH
    ? (alarm?.challenge.config as MathChallengeConfig)?.questions || 1
    : 1;

  const stopEverything = async () => {
    console.log('Stopping everything (native sound & vibration)...');
    try {
      if (Platform.OS === 'android' && AlarmModule) {
        AlarmModule.stopAlarmService();
      }
    } catch (e) {
      console.error('Error in stopEverything:', e);
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    if (alarm) {
      generateNewChallenge();
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return () => {
      backHandler.remove();
    };
  }, [currentQuestionIndex, alarm?.id]);


  useEffect(() => {
    if (scannedData && challengeType === ChallengeType.QR_SCAN) {
      handleQRScanResult(scannedData);
    }
  }, [scannedData]);

  const generateNewChallenge = async () => {
    if (!alarm || !alarm.challenge) return;

    const { type, config } = alarm.challenge;

    switch (type) {
      case ChallengeType.MATH:
        const mathConfig = config as MathChallengeConfig;
        let difficulty = mathConfig.difficulty;

        if (alarm.snooze.mustGetUpModeEnabled && params.snoozeCount! > 0) {
          const maxDifficulty = CHALLENGE_DIFFICULTY_LEVELS[CHALLENGE_DIFFICULTY_LEVELS.length - 1];
          const isFinalSnooze = params.snoozeCount! >= alarm.snooze.maxCount - 1;

          if (alarm.snooze.mustGetUpForceMaxDifficulty && isFinalSnooze) {
            difficulty = maxDifficulty;
          } else {
            difficulty = Math.min(maxDifficulty, difficulty + params.snoozeCount!);
          }
        }

        const problems = generateMathProblems(difficulty as any, 1);
        if (problems && problems.length > 0) {
          setChallenge({
            question: problems[0].question,
            answer: String(problems[0].answer),
          } as MathChallengeProblem);
        }
        break;

      case ChallengeType.WORD_PUZZLE:
        const wordConfig = config as WordPuzzleConfig;
        const puzzles = generateWordPuzzles(wordConfig.difficulty, 1, language);
        if (puzzles && puzzles.length > 0) {
          setChallenge({
            question: puzzles[0].question,
            answer: puzzles[0].answer,
            scrambled: puzzles[0].scrambled,
            hint: puzzles[0].hint || '',
          } as WordChallengeProblem);
        }
        break;

      case ChallengeType.QR_SCAN:
        const qrConfig = config as QRScanConfig;
        setChallenge({
          question: t('qrChallengeQuestion'),
          answer: qrConfig.targetValue,
          instruction: t('qrChallengeInstruction'),
        } as QRChallengeProblem);
        break;

      case ChallengeType.NONE:
        setChallenge({
          question: t('timeToWakeUp'),
          answer: 'DISMISS',
        } as ChallengeProblem);
        break;
    }
  };

  const handleDismissFlow = async (currentAlarm: Alarm) => {
    await stopEverything();
    addEvent({
      type: 'alarm_dismissed',
      itemId: currentAlarm.id,
      itemName: currentAlarm.name,
      details: `Dismissed with ${currentAlarm.challenge.type} challenge after ${attempts + 1} total attempts`,
    });

    if (!currentAlarm.repeats) {
      // This is a one-time alarm. Disable it so it doesn't reschedule.
      updateAlarm(currentAlarm.id, { isEnabled: false });
    }
    // If it's a repeating alarm, do nothing. The OS handles the next trigger.

    setTimeout(() => router.back(), 1500);
  };

  const handleSimpleDismiss = async () => {
    if (isCompleted || !alarm) return;
    setIsCompleted(true);
    setFeedback({ message: language === 'ar' ? 'يجب أن يتوقف المنبه' : 'Alarm should stop', type: 'success' });
    await stopEverything();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await handleDismissFlow(alarm);
  };


  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!challenge || !alarm) return;
    const isCorrect = userAnswer.toUpperCase().trim() === challenge.answer.toUpperCase();
    if (isCorrect) {
      if (currentQuestionIndex + 1 < totalQuestions) {
        setCurrentQuestionIndex(prev => prev + 1);
        setUserAnswer('');
        setAttempts(0);
        setFeedback({ message: language === 'ar' ? 'إجابة صحيحة' : 'Correct answer', type: 'success' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setIsCompleted(true);
        setFeedback({ message: language === 'ar' ? 'يجب أن يتوقف المنبه' : 'Alarm should stop', type: 'success' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Notifications.cancelScheduledNotificationAsync(`snooze_alarm_${alarm.id}`);
        await handleDismissFlow(alarm);
      }
    } else {
      setAttempts(prev => prev + 1);
      setUserAnswer('');
      setFeedback({ message: language === 'ar' ? 'المنبه لن يتوقف' : 'Alarm should not stop', type: 'error' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (attempts >= 2) {
        Alert.alert(
          t('tooManyAttemptsTitle'),
          t('tooManyAttemptsMessage'),
          [{ text: t('tryAgain'), onPress: () => setAttempts(0) }]
        );
      }
    }
  };

  const handleSnooze = async () => {
    console.log('Snooze initiated');
    await stopEverything();
    if (!alarm) return;

    if (params.snoozeCount! >= alarm.snooze.maxCount) {
      Alert.alert(t('maxSnoozesReached'), t('maxSnoozesMessage'));
      return;
    }

    // Check if device is locked
    let locked = false;
    if (Platform.OS === 'android' && AlarmModule?.isDeviceLocked) {
      locked = await AlarmModule.isDeviceLocked();
    }

    // 1. Always schedule the snooze first (Policy requirement: Ad must not block functionality)
    performSnoozeScheduling(alarm);

    if (isAdLoaded) {
      setIsAdShowing(true);
      try {
        await interstitial.show();
      } catch (err) {
        console.error('Ad show failed:', err);
        setIsAdShowing(false);
        finalizeSnoozeAndExit();
      }
    } else {
      // If ad not loaded yet, just proceed
      if (locked) {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Attention',
          language === 'ar' ? 'يرجى فتح قفل الهاتف لإكمال عملية الغفوة' : 'Please unlock your phone to complete snooze',
          [{ text: 'OK', onPress: () => finalizeSnoozeAndExit() }]
        );
      } else {
        finalizeSnoozeAndExit();
      }
    }
  };


  const handleOpenQRScanner = () => {
    if (!alarm) return;
    router.push({
      pathname: '/qr-scanner',
      params: {
        returnPath: '/alarm-challenge',
        alarmId: alarm.id,
        challengeType: alarm.challenge.type,
        snoozeCount: params.snoozeCount,
      }
    });
  };

  const handleQRScanResult = async (data: string) => {
    if (!challenge || !alarm) return;
    if (data === challenge.answer) {
      setIsCompleted(true);
      setFeedback({ message: language === 'ar' ? 'يجب أن يتوقف المنبه' : 'Alarm should stop', type: 'success' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Notifications.cancelScheduledNotificationAsync(`snooze_alarm_${alarm.id}`);
      await handleDismissFlow(alarm);
    } else {
      setAttempts(prev => prev + 1);
      setFeedback({ message: language === 'ar' ? 'المنبه لن يتوقف' : 'Alarm should not stop', type: 'error' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('errorTitle'), t('wrongQrCode'));
    }
  };

  if (!alarm || !challenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('loadingChallenge')}</Text>
      </View>
    );
  }

  const formattedTime = new Date().toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      {/* AdMob is handled via InterstitialAd.show() */}
      <View style={styles.header}>
        <Bell size={64} color="white" />
        <Text style={styles.alarmName}>{alarm.name}</Text>
        <Text style={styles.currentRealTime}>{formattedTime}</Text>
        <View style={styles.alarmTimeBadge}>
          <Text style={styles.alarmTimeText}>{alarm.time}</Text>
        </View>
        {totalQuestions > 1 && params.challengeType === ChallengeType.MATH && (
          <Text style={styles.progress}>
            {t('questionProgress', { current: currentQuestionIndex + 1, total: totalQuestions })}
          </Text>
        )}
      </View>

      <View style={styles.challengeContainer}>
        <View style={styles.challengeIcon}>
          {params.challengeType === ChallengeType.NONE && <Bell size={32} color={colors.primary} />}
          {params.challengeType === ChallengeType.MATH && <Calculator size={32} color={colors.primary} />}
          {params.challengeType === ChallengeType.WORD_PUZZLE && <FileText size={32} color={colors.primary} />}
          {params.challengeType === ChallengeType.QR_SCAN && <QrCode size={32} color={colors.primary} />}
        </View>
        <Text style={styles.challengeTitle}>{params.challengeType === ChallengeType.NONE ? t('timeToWakeUp') : t(params.challengeType + 'Challenge')}</Text>
        {params.challengeType !== ChallengeType.NONE && (
          <Text style={[
            styles.question,
            params.challengeType === ChallengeType.MATH && { writingDirection: 'ltr' }
          ]}>
            {params.challengeType === ChallengeType.MATH ? `\u200E${challenge.question}\u200E` : challenge.question}
          </Text>
        )}

        {'instruction' in challenge && challenge.instruction && (
          <Text style={styles.instruction}>{challenge.instruction}</Text>
        )}

        {params.challengeType !== ChallengeType.QR_SCAN && params.challengeType !== ChallengeType.NONE && (
          <Input
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder={t('enterAnswerPlaceholder')}
            style={styles.input}
            autoFocus
            keyboardType={params.challengeType === ChallengeType.MATH ? 'numeric' : 'default'}
            autoCapitalize={params.challengeType === ChallengeType.WORD_PUZZLE ? 'characters' : 'none'}
          />
        )}

        {feedback.type && (
          <Text style={[styles.feedbackText, feedback.type === 'error' ? styles.errorText : styles.successFeedbackText]}>
            {feedback.message}
          </Text>
        )}

        {attempts > 0 && <Text style={styles.attemptsText}>{t('incorrectAttempts', { attempts })}</Text>}
        {isCompleted && <Text style={styles.successText}>{t('correctDismissing')}</Text>}
      </View>

      <View style={styles.actions}>
        {params.challengeType === ChallengeType.NONE ? (
          <View style={styles.noneActions}>
            <Button
              title={t('snoozeWithAd', {
                minutes: alarm.snooze.durationMinutes
              })}
              onPress={handleSnooze}
              variant="outline"
              style={[styles.snoozeButton, { flex: 1 }]}
              textStyle={styles.snoozeButtonText}
              leftIcon={<VideoIcon size={18} color={colors.primary} />}
              disabled={isCompleted || params.snoozeCount! >= alarm.snooze.maxCount}
            />
            <Button
              title={t('stop') || 'STOP'}
              onPress={handleSimpleDismiss}
              style={[styles.submitButton, { flex: 1, backgroundColor: colors.error }]}
              disabled={isCompleted}
            />
          </View>
        ) : params.challengeType === ChallengeType.QR_SCAN ? (
          <Button
            title={language === 'ar' ? 'مسح رمز QR للتوقف' : 'Scan QR to Stop'}
            onPress={handleOpenQRScanner}
            fullWidth
            style={styles.submitButton}
            leftIcon={<Camera size={20} color="white" />}
          />
        ) : (
          <Button
            title={currentQuestionIndex + 1 < totalQuestions ? t('nextQuestion') : (language === 'ar' ? 'فحص الإجابة' : 'CHECK')}
            onPress={handleSubmit}
            disabled={!userAnswer.trim() || isCompleted}
            fullWidth
            style={styles.submitButton}
          />
        )}

        {params.challengeType !== ChallengeType.NONE && alarm.snooze.enabled && (
          <Button
            title={t('snoozeWithAd', {
              minutes: alarm.snooze.durationMinutes
            })}
            onPress={handleSnooze}
            variant="outline"
            fullWidth
            style={styles.snoozeButton}
            textStyle={styles.snoozeButtonText}
            leftIcon={<VideoIcon size={18} color={colors.primary} />}
            disabled={isCompleted || params.snoozeCount! >= alarm.snooze.maxCount}
          />
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  alarmName: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  time: {
    fontSize: theme.typography.fontSizes.lg,
    color: 'white',
    opacity: 0.8,
    marginTop: theme.spacing.sm,
  },
  currentRealTime: {
    fontSize: theme.typography.fontSizes.xl,
    color: 'white',
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  alarmTimeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
  },
  alarmTimeText: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700',
    color: 'white',
  },
  progress: {
    fontSize: theme.typography.fontSizes.md,
    color: 'white',
    opacity: 0.9,
    marginTop: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  challengeContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  challengeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  challengeTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  question: {
    fontSize: theme.typography.fontSizes.lg,
    color: colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
    fontWeight: '500',
  },
  hint: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.info,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: colors.info + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  instruction: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  input: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  feedbackText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  successFeedbackText: {
    color: colors.success,
    backgroundColor: colors.success + '10',
  },
  errorText: {
    color: colors.error,
    backgroundColor: colors.error + '10',
  },
  attemptsText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    backgroundColor: colors.error + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  successText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    backgroundColor: colors.success + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  actions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  noneActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  submitButton: {
    backgroundColor: colors.success,
  },
  snoozeButton: {
    borderColor: 'white',
  },
  snoozeButtonText: {
    color: 'white',
  },
  loadingText: {
    fontSize: theme.typography.fontSizes.lg,
    color: 'white',
    textAlign: 'center',
  },
  adContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  adTitle: {
    color: 'white',
    fontSize: theme.typography.fontSizes.lg,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  adVideo: {
    width: '100%',
    height: 300,
  },
  skipAdButton: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.md,
  },
  skipAdText: {
    color: 'white',
    fontSize: theme.typography.fontSizes.sm,
  },
});