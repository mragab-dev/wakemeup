import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';
import { useAlarmStore, createDefaultAlarm } from '@/store/alarmStore';
import AlarmForm from '@/components/forms/AlarmForm';
import { Alarm } from '@/types';
import { ChevronLeft } from 'lucide-react-native';
import theme from '@/constants/theme';

export default function AlarmFormScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { alarms, addAlarm, updateAlarm } = useAlarmStore();
    const { colors } = useTheme();
    const { t } = useSettingsStore();

    const [initialAlarm, setInitialAlarm] = useState<Alarm | null>(null);

    useEffect(() => {
        if (id) {
            const alarm = alarms.find(a => a.id === id);
            if (alarm) {
                setInitialAlarm(alarm);
            }
        }
    }, [id, alarms]);

    const handleSubmit = (alarmData: Omit<Alarm, 'id'> | Alarm) => {
        if ('id' in alarmData) {
            updateAlarm(alarmData.id, alarmData);
        } else {
            addAlarm(alarmData);
        }
        router.back();
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerTitle: id ? t('editAlarm') : t('newAlarm'),
                    headerLeft: () => (
                        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                            <ChevronLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                    ),
                    headerStyle: { backgroundColor: colors.card },
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
                }}
            />
            <View style={styles.formWrapper}>
                <AlarmForm
                    initialAlarm={initialAlarm}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    formWrapper: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
    },
    backButton: {
        marginLeft: -theme.spacing.xs,
        padding: theme.spacing.xs,
    }
});
