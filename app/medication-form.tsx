import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';
import { useMedicationStore } from '@/store/medicationStore';
import MedicationForm from '@/components/forms/MedicationForm';
import { Medication } from '@/types';
import { ChevronLeft } from 'lucide-react-native';
import theme from '@/constants/theme';

export default function MedicationFormScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { medications, addMedication, updateMedication } = useMedicationStore();
    const { colors } = useTheme();
    const { t } = useSettingsStore();

    const [initialMedication, setInitialMedication] = useState<Medication | null>(null);

    useEffect(() => {
        if (id) {
            const med = medications.find(m => m.id === id);
            if (med) {
                setInitialMedication(med);
            }
        }
    }, [id, medications]);

    const handleSubmit = (medData: Omit<Medication, 'id'> | Medication) => {
        if ('id' in medData) {
            updateMedication(medData.id, medData as Medication);
        } else {
            addMedication(medData);
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
                    headerTitle: id ? t('editMedication') : t('addMedication'),
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
                <MedicationForm
                    initialMedication={initialMedication}
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
