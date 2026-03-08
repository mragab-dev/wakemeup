import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
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

  const [isLanguageModalVisible, setLanguageModalVisible] = React.useState(false);

  const handleLanguageChange = () => {
    setLanguageModalVisible(true);
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
                <Text style={styles.settingLabel}>{t('permissionsStatus')}</Text>
                <Text style={styles.settingDescription}>{t('permissionsStatusDescription')}</Text>
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

      <Modal
        visible={isLanguageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('language')}</Text>
            <Text style={styles.modalDescription}>{t('languageDescription')}</Text>

            {languageOptions.map((lang, index) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.modalOption,
                  language === lang.code && { backgroundColor: colors.primary + '20' },
                  index === languageOptions.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => {
                  updateSettings({ language: lang.code });
                  setLanguageModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    language === lang.code && { color: colors.primary, fontWeight: 'bold' }
                  ]}
                >
                  {lang.nativeName} ({lang.name})
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </ScrollView >
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.text,
    textAlign: 'center',
  },
  modalCancelButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: 'bold',
    color: colors.error,
  },
});
