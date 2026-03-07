import React from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';

export default function PrivacyPolicyScreen() {
    const { colors } = useTheme();
    const { language, t } = useSettingsStore();

    const isRTL = language === 'ar';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: t('privacyPolicy'),
                    headerShown: true,
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {language === 'ar' ? 'سياسة الخصوصية لبرنامج WakeMeUp' : 'Privacy Policy for WakeMeUp'}
                    </Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                        {language === 'ar' ? 'آخر تحديث: مارس 2024' : 'Last Updated: March 2024'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.heading, { color: colors.primary }]}>
                        {language === 'ar' ? '1. جمع المعلومات' : '1. Information Collection'}
                    </Text>
                    <Text style={[styles.paragraph, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {language === 'ar'
                            ? 'نحن لا نجمع أي بيانات شخصية مباشرة. يتم تخزين جميع بيانات المنبهات والأدوية محلياً على جهازك فقط.'
                            : 'We do not collect any personal data directly. All alarm and medication data is stored locally on your device only.'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.heading, { color: colors.primary }]}>
                        {language === 'ar' ? '2. الأذونات المطلوبة' : '2. Permissions Required'}
                    </Text>
                    <Text style={[styles.paragraph, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {language === 'ar'
                            ? 'يتطلب التطبيق أذونات الكاميرا (لمسح رمز QR)، والظهور فوق التطبيقات الأخرى (لإظهار المنبه)، واستثناء تحسين البطارية (لضمان عمل المنبه في الوقت المحدد).'
                            : 'The app requires camera permissions (for QR scanning), draw over other apps (to show the alarm), and battery optimization exclusion (to ensure alarms trigger on time).'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.heading, { color: colors.primary }]}>
                        {language === 'ar' ? '3. خدمات الطرف الثالث' : '3. Third Party Services'}
                    </Text>
                    <Text style={[styles.paragraph, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {language === 'ar'
                            ? 'نحن نستخدم AdMob لعرض الإعلانات. قد تقوم AdMob بجمع واستخدام معرفات الإعلانات للأغراض المتعلقة بالإعلانات والتحليلات.'
                            : 'We use AdMob for displaying advertisements. AdMob may collect and use advertising identifiers for advertisement and analytics purposes.'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.heading, { color: colors.primary }]}>
                        {language === 'ar' ? '4. التغييرات على هذه السياسة' : '4. Changes to This Policy'}
                    </Text>
                    <Text style={[styles.paragraph, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {language === 'ar'
                            ? 'قد نقوم بتحديث سياسة الخصوصية الخاصة بنا من حين لآخر. يُنصح بمراجعة هذه الصفحة بشكل دوري.'
                            : 'We may update our Privacy Policy from time to time. You are advised to review this page periodically.'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.heading, { color: colors.primary }]}>
                        {language === 'ar' ? '5. اتصل بنا' : '5. Contact Us'}
                    </Text>
                    <Text style={[styles.paragraph, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {language === 'ar'
                            ? 'إذا كان لديك أي أسئلة، يرجى الاتصال بنا عبر البريد الإلكتروني الخاص بالمطور.'
                            : 'If you have any questions, please contact us via the developer email.'}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
        marginBottom: 16,
    },
    heading: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
    },
});
