import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import Card from '@/components/ui/Card';
import { Stack } from 'expo-router';
import { 
  Bell, 
  Pill, 
  Calculator, 
  FileText, 
  QrCode,
  BarChart3,
  Shield,
  Smartphone,
  Target,
  Heart,
  Brain,
} from 'lucide-react-native';

export default function AboutScreen() {
  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const styles = createStyles(colors);
  
  const features = [
    { icon: Bell, titleKey: 'feature_smartAlarms_title', descriptionKey: 'feature_smartAlarms_desc', color: colors.primary },
    { icon: Calculator, titleKey: 'feature_math_title', descriptionKey: 'feature_math_desc', color: colors.success },
    { icon: FileText, titleKey: 'feature_word_title', descriptionKey: 'feature_word_desc', color: colors.warning },
    { icon: QrCode, titleKey: 'feature_qr_title', descriptionKey: 'feature_qr_desc', color: colors.info },
    { icon: Pill, titleKey: 'feature_meds_title', descriptionKey: 'feature_meds_desc', color: colors.secondary },
    { icon: BarChart3, titleKey: 'feature_reports_title', descriptionKey: 'feature_reports_desc', color: colors.error },
  ];
  
  const benefits = [
    { icon: Brain, titleKey: 'benefit_habits_title', descriptionKey: 'benefit_habits_desc' },
    { icon: Heart, titleKey: 'benefit_adherence_title', descriptionKey: 'benefit_adherence_desc' },
    { icon: Shield, titleKey: 'benefit_health_title', descriptionKey: 'benefit_health_desc' },
  ];
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: t('aboutTitle'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }} 
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.appIcon}>
            <Bell size={48} color="white" />
          </View>
          <Text style={styles.appName}>{t('wakeUpTitle')}</Text>
          <Text style={styles.version}>{t('version')}</Text>
          <Text style={styles.description}>{t('appDescription')}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('features')}</Text>
          {features.map((feature, index) => (
            <Card key={index} variant="elevated" style={styles.featureCard}>
              <View style={styles.featureContent}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                  <feature.icon size={24} color={feature.color} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                  <Text style={styles.featureDescription}>{t(feature.descriptionKey)}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('benefits')}</Text>
          {benefits.map((benefit, index) => (
            <Card key={index} variant="elevated" style={styles.benefitCard}>
              <View style={styles.benefitContent}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.success + '20' }]}>
                  <benefit.icon size={20} color={colors.success} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{t(benefit.titleKey)}</Text>
                  <Text style={styles.benefitDescription}>{t(benefit.descriptionKey)}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('challengesExplained')}</Text>
          
          <Card variant="elevated" style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Calculator size={24} color={colors.primary} />
              <Text style={styles.challengeTitle}>{t('mathChallenge')}</Text>
            </View>
            <Text style={styles.challengeDescription}>{t('feature_math_desc')}</Text>
          </Card>
          
          <Card variant="elevated" style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <FileText size={24} color={colors.warning} />
              <Text style={styles.challengeTitle}>{t('wordPuzzle')}</Text>
            </View>
            <Text style={styles.challengeDescription}>{t('feature_word_desc')}</Text>
          </Card>
          
          <Card variant="elevated" style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <QrCode size={24} color={colors.info} />
              <Text style={styles.challengeTitle}>{t('qrCodeChallenge')}</Text>
            </View>
            <Text style={styles.challengeDescription}>{t('feature_qr_desc')}</Text>
          </Card>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('footer_love')}</Text>
          <Text style={styles.copyright}>{t('footer_copyright')}</Text>
        </View>
      </ScrollView>
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  appName: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: theme.spacing.xs,
  },
  version: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: theme.spacing.md,
  },
  featureCard: {
    marginBottom: theme.spacing.md,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  benefitCard: {
    marginBottom: theme.spacing.md,
  },
  benefitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  challengeCard: {
    marginBottom: theme.spacing.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  challengeTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginLeft: theme.spacing.sm,
  },
  challengeDescription: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
  },
  footerText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  copyright: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
