import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import Card from '@/components/ui/Card';
import Switch from '@/components/ui/Switch';
import {
  Palette,
  Globe,
  Bell,
  Info,
  ShieldCheck,
  ChevronRight,
  Moon,
  Sun,
  Smartphone
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Language } from '@/constants/locales';

const languageOptions = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'ar' as Language, name: 'Arabic', nativeName: 'العربية' },
  { code: 'es' as Language, name: 'Spanish', nativeName: 'Español' },
  { code: 'ru' as Language, name: 'Russian', nativeName: 'Русский' },
  { code: 'de' as Language, name: 'German', nativeName: 'Deutsch' },
];

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Smartphone },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const {
    theme: currentTheme,
    language,
    vibrationEnabled,
    updateSettings,
    t
  } = useSettingsStore();

  const styles = createStyles(colors);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme: newTheme });
  };

  const handleLanguageChange = () => {
    Alert.alert(
      t('language'),
      t('languageDescription'),
      [
        { text: t('cancel'), style: 'cancel' },
        ...languageOptions.map(lang => ({
          text: `${lang.nativeName} (${lang.name})`,
          onPress: () => updateSettings({ language: lang.code }),
          style: 'default' as const,
        })),
      ]
    );
  };

  const getCurrentLanguageName = () => {
    const current = languageOptions.find(lang => lang.code === language);
    return current ? `${current.nativeName} (${current.name})` : 'English';
  };

  const getCurrentThemeName = () => {
    const current = themeOptions.find(opt => opt.value === currentTheme);
    return current ? t(current.label.toLowerCase()) : t('light');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('appearance')}</Text>

        <Card variant="elevated" style={styles.card}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                t('theme'),
                t('themeDescription'),
                [
                  { text: t('cancel'), style: 'cancel' },
                  ...themeOptions.map(option => ({
                    text: t(option.label.toLowerCase()),
                    onPress: () => handleThemeChange(option.value as any),
                  })),
                ]
              );
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Palette size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={styles.settingLabel}>{t('theme')}</Text>
                <Text style={styles.settingDescription}>{getCurrentThemeName()}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>

        <Card variant="elevated" style={styles.card}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLanguageChange}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.info + '20' }]}>
                <Globe size={20} color={colors.info} />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={styles.settingLabel}>{t('language')}</Text>
                <Text style={styles.settingDescription}>{getCurrentLanguageName()}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications')}</Text>

        <Card variant="elevated" style={styles.card}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/permissions' as any)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <ShieldCheck size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={styles.settingLabel}>حالة الصلاحيات</Text>
                <Text style={styles.settingDescription}>فحص صلاحيات النظام والتطبيق</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
                <Bell size={20} color={colors.warning} />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={styles.settingLabel}>{t('vibration')}</Text>
                <Text style={styles.settingDescription}>{t('vibrationSettingDescription')}</Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('about')}</Text>

        <Card variant="elevated" style={styles.card}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/about')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
                <Info size={20} color={colors.secondary} />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={styles.settingLabel}>{t('about')}</Text>
                <Text style={styles.settingDescription}>{t('aboutDescription')}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/privacy-policy' as any)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.info + '20' }]}>
                <ShieldCheck size={20} color={colors.info} />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={styles.settingLabel}>{t('privacyPolicy')}</Text>
                <Text style={styles.settingDescription}>{language === 'ar' ? 'تعرف على كيفية حماية بياناتك' : 'Learn how we protect your data'}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
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
    paddingBottom: 160,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: theme.spacing.md,
  },
  card: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
  },
});
