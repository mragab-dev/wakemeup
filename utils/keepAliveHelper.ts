import { Platform } from 'react-native';
import nativeAlarm from './nativeAlarm';
import { useAlarmStore } from '../store/alarmStore';
import { useMedicationStore } from '../store/medicationStore';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Checks if there are any active alarms or medications and starts/stops 
 * the Android foreground 'Keep-Alive' service accordingly.
 */
export const updateKeepAliveServiceStatus = () => {
    if (Platform.OS !== 'android') return;

    try {
        const { keepAliveEnabled, t } = useSettingsStore.getState();

        // If user disabled Keep-Alive, force stop the service and return
        if (!keepAliveEnabled) {
            console.log('Keep-Alive: Disabled in settings. Stopping service.');
            nativeAlarm.stopKeepAliveService();
            return;
        }

        const alarms = useAlarmStore.getState().alarms;
        const medications = useMedicationStore.getState().medications;

        const hasEnabledAlarms = alarms.some(alarm => alarm.isEnabled);
        const hasActiveMedications = medications.some(med => med.doses && med.doses.length > 0);

        if (hasEnabledAlarms || hasActiveMedications) {
            console.log('Keep-Alive: Starting service (Active alarms/meds found)');
            nativeAlarm.startKeepAliveService(t('keepAliveTitle'), t('keepAliveContent'));
        } else {
            console.log('Keep-Alive: Stopping service (No active alarms/meds)');
            nativeAlarm.stopKeepAliveService();
        }
    } catch (error) {
        console.error('Error updating Keep-Alive status:', error);
    }
};
