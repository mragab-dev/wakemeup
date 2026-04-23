import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, AppState } from 'react-native';
import { ShieldAlert, ChevronRight } from 'lucide-react-native';
import theme from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';
import nativeAlarm from '@/utils/nativeAlarm';

const PermissionWarningBanner = () => {
    const { colors } = useTheme();
    const { t } = useSettingsStore();
    const [missingPermissions, setMissingPermissions] = useState<string[]>([]);

    const checkPermissions = async () => {
        if (Platform.OS !== 'android') return;

        const issues: string[] = [];

        try {
            const isIgnoringBattery = await nativeAlarm.isIgnoringBatteryOptimizations();
            if (!isIgnoringBattery) issues.push('battery');

            const canDrawOverlay = await nativeAlarm.canDrawOverlays();
            if (!canDrawOverlay) issues.push('overlay');

            const canExactAlarm = await nativeAlarm.canScheduleExactAlarms();
            if (!canExactAlarm) issues.push('exact_alarm');
        } catch (e) {
            console.error('Error checking permissions for banner:', e);
        }

        setMissingPermissions(issues);
    };

    useEffect(() => {
        checkPermissions();

        // Refresh when app comes back from settings
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkPermissions();
            }
        });

        return () => subscription.remove();
    }, []);

    if (missingPermissions.length === 0) return null;

    const handleFix = (type: string) => {
        switch (type) {
            case 'battery':
                nativeAlarm.requestIgnoreBatteryOptimizations();
                break;
            case 'overlay':
                nativeAlarm.requestOverlayPermission();
                break;
            case 'exact_alarm':
                nativeAlarm.requestExactAlarmPermission();
                break;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
            <View style={styles.header}>
                <ShieldAlert size={20} color={colors.error} />
                <Text style={[styles.title, { color: colors.error }]}>
                    {t('permissionsRequired')}
                </Text>
            </View>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
                {t('permissionWarningDescription')}
            </Text>

            <View style={styles.issuesList}>
                {missingPermissions.map((issue) => (
                    <TouchableOpacity
                        key={issue}
                        onPress={() => handleFix(issue)}
                        style={[styles.issueItem, { backgroundColor: colors.background }]}
                    >
                        <View style={styles.issueInfo}>
                            <View style={[styles.dot, { backgroundColor: colors.error }]} />
                            <Text style={[styles.issueText, { color: colors.text }]}>
                                {t(`permission_${issue}`)}
                            </Text>
                        </View>
                        <ChevronRight size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
        gap: theme.spacing.xs,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: theme.spacing.sm,
    },
    issuesList: {
        gap: theme.spacing.xs,
    },
    issueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.sm,
    },
    issueInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    issueText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default PermissionWarningBanner;
