

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { ChallengeType } from '@/types';
import { X, Calculator, FileText, QrCode, Plus, Minus } from 'lucide-react-native';
import { useSettingsStore } from '@/store/settingsStore';
import Card from '@/components/ui/Card';
import { generateMathProblems } from '@/utils/challengeHelpers';

interface ChallengeSelectorProps {
  selectedType: ChallengeType;
  selectedDifficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  onTypeChange: (type: ChallengeType) => void;
  onDifficultyChange: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onQuestionCountChange: (count: number) => void;
}

const ChallengeExample: React.FC<{ type: ChallengeType; difficulty: 'easy' | 'medium' | 'hard' }> = ({ type, difficulty }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const getExampleText = () => {
    if (type === ChallengeType.MATH) {
      const levelMap = { 'easy': 2, 'medium': 4, 'hard': 5 };
      const problem = generateMathProblems(levelMap[difficulty], 1)[0];
      return problem.question.replace(' = ?', '');
    }
    return null;
  };

  const exampleText = getExampleText();
  if (!exampleText) return null;

  return (
    <View style={styles.exampleContainer}>
      <Text style={styles.exampleLabel}>e.g.</Text>
      <Text style={styles.exampleText}>{exampleText}</Text>
    </View>
  );
};


export const ChallengeSelector: React.FC<ChallengeSelectorProps> = ({
  selectedType,
  selectedDifficulty,
  questionCount,
  onTypeChange,
  onDifficultyChange,
  onQuestionCountChange,
}) => {
  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const styles = createStyles(colors);

  const challengeOptions = [
    { type: ChallengeType.NONE, icon: X, title: t('none'), description: t('challengeDesc_none') },
    { type: ChallengeType.MATH, icon: Calculator, title: t('math'), description: t('challengeDesc_math') },
    { type: ChallengeType.WORD_PUZZLE, icon: FileText, title: t('wordPuzzle'), description: t('challengeDesc_word') },
    { type: ChallengeType.QR_SCAN, icon: QrCode, title: t('qrScan'), description: t('challengeDesc_qr') },
  ];
  
  const difficultyLevels = [
    { value: 'easy', label: t('difficulty_easy') },
    { value: 'medium', label: t('difficulty_medium') },
    { value: 'hard', label: t('difficulty_hard') },
  ];

  const renderChallengeOption = (option: typeof challengeOptions[0]) => {
    const isSelected = selectedType === option.type;
    return (
      <TouchableOpacity
        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
        onPress={() => onTypeChange(option.type)}
        key={option.type}
      >
        <option.icon size={28} color={isSelected ? colors.primary : colors.text} />
        <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>{option.title}</Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('dismissalChallenge')}</Text>
      
      <View style={styles.grid}>
        {challengeOptions.map(renderChallengeOption)}
      </View>
      
      {selectedType === ChallengeType.WORD_PUZZLE && (
        <Text style={styles.noteText}>{t('challengeNote')}</Text>
      )}

      {selectedType !== ChallengeType.NONE && (
        <Card style={styles.configContainer} variant='outlined'>
          {(selectedType === ChallengeType.MATH || selectedType === ChallengeType.WORD_PUZZLE) && (
            <>
              <Text style={styles.configLabel}>{t('difficultyLevel')}</Text>
              <View style={styles.segmentedControl}>
                {difficultyLevels.map(level => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.segmentButton,
                      selectedDifficulty === level.value && styles.segmentButtonSelected
                    ]}
                    onPress={() => onDifficultyChange(level.value as any)}
                  >
                    <Text style={[
                      styles.segmentText,
                      selectedDifficulty === level.value && styles.segmentTextSelected
                    ]}>{level.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ChallengeExample type={selectedType} difficulty={selectedDifficulty} />

              {selectedType === ChallengeType.MATH && (
                <>
                  <Text style={styles.configLabel}>{t('numberOfQuestions')}</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => onQuestionCountChange(Math.max(1, questionCount - 1))}
                    >
                      <Minus size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{questionCount}</Text>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => onQuestionCountChange(Math.min(10, questionCount + 1))}
                    >
                      <Plus size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}

          {selectedType === ChallengeType.QR_SCAN && (
            <View style={styles.qrInstructions}>
              <Text style={styles.qrTitle}>{t('qrSetupTitle')}</Text>
              <Text style={styles.qrStep}>1. {t('qrSetupStep1')}</Text>
              <Text style={styles.qrStep}>2. {t('qrSetupStep2')}</Text>
              <Text style={styles.qrStep}>3. {t('qrSetupStep3')}</Text>
              <Text style={styles.qrNote}>💡 {t('qrSetupNote')}</Text>
            </View>
          )}
        </Card>
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  optionTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: theme.typography.fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    minHeight: 30,
  },
  noteText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  configContainer: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  configLabel: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500',
    color: colors.text,
    marginBottom: theme.spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.md - 2, // Adjust for inner fit
    margin: 2,
  },
  segmentText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: 'white',
  },
  exampleContainer: {
    backgroundColor: colors.info + '10',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
  },
  exampleLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.info,
    fontWeight: 'bold',
    marginRight: theme.spacing.sm,
  },
  exampleText: {
    fontSize: theme.typography.fontSizes.lg,
    color: colors.text,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: theme.spacing.lg,
  },
  qrInstructions: {
    backgroundColor: colors.info + '10',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  qrTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600',
    color: colors.info,
    marginBottom: theme.spacing.sm,
  },
  qrStep: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.text,
    marginBottom: 4,
  },
  qrNote: {
    fontSize: theme.typography.fontSizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
});

export default ChallengeSelector;