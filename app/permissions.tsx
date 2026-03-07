
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, Platform, NativeModules, RefreshControl, TouchableOpacity } from 'react-native';
import theme from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import * as Notifications from 'expo-notifications';
import * as ExpoCamera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
    ShieldCheck,
    ShieldAlert,
    Bell,
    Camera,
    Image as ImageIcon,
    Clock,
    Battery,
    Layers,
    ChevronRight,
    RefreshCcw,
    CheckCircle2,
    XCircle
} from 'lucide-react-native';
import { Stack } from 'expo-router';

const { AlarmModule } = NativeModules;

export default function PermissionStatusScreen() {
    const { colors } = useTheme();
    const { t } = useSettingsStore();
    const [refreshing, setRefreshing] = useState(false);

    const [statuses, setStatuses] = useState({
        notifications: 'undetermined',
        camera: 'undetermined',
        photos: 'undetermined',
        exactAlarm: false,
        batteryOptimization: false,
        overlay: false,
    });

    const styles = createStyles(colors);

    useEffect(() => {
        checkAllPermissions();
    }, []);

    const checkAllPermissions = async () => {
        setRefreshing(true);
        try {
            const { status: notifStatus } = await Notifications.getPermissionsAsync();
            const { status: camStatus } = await ExpoCamera.Camera.getCameraPermissionsAsync();
            const { status: photoStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

            let exact = true;
            let battery = true;
            let overlay = true;

            if (Platform.OS === 'android' && AlarmModule) {
                exact = await AlarmModule.canScheduleExactAlarms();
                battery = await AlarmModule.isIgnoringBatteryOptimizations();
                overlay = await AlarmModule.canDrawOverlays();
            }

            setStatuses({
                notifications: notifStatus,
                camera: camStatus,
                photos: photoStatus,
                exactAlarm: exact,
                batteryOptimization: battery,
                overlay: overlay,
            });
        } catch (e) {
            console.error(e);
        } finally {
            setRefreshing(false);
        }
    };

    const getStatusIcon = (status: string | boolean) => {
        if (typeof status === 'boolean') {
            return status ? <CheckCircle2 size={24} color={colors.success} /> : <XCircle size={24} color={colors.error} />;
        }
        return status === 'granted' ? <CheckCircle2 size={24} color={colors.success} /> : <XCircle size={24} color={colors.error} />;
    };

    const getStatusText = (status: string | boolean) => {
        if (typeof status === 'boolean') {
            return status ? "مفعلة" : "غير مفعلة";
        }
        switch (status) {
            case 'granted': return "مسموح";
            case 'denied': return "مرفوض";
            default: return "غير محدد";
        }
    };

    const requestPermission = async (type: string) => {
        if (Platform.OS !== 'android' && type !== 'notifications' && type !== 'camera' && type !== 'photos') return;

        switch (type) {
            case 'notifications':
                await Notifications.requestPermissionsAsync();
                break;
            case 'camera':
                await ExpoCamera.Camera.requestCameraPermissionsAsync();
                break;
            case 'photos':
                await ImagePicker.requestMediaLibraryPermissionsAsync();
                break;
            case 'exactAlarm':
                AlarmModule?.requestExactAlarmPermission();
                break;
            case 'battery':
                AlarmModule?.requestIgnoreBatteryOptimizations();
                break;
            case 'overlay':
                AlarmModule?.requestOverlayPermission();
                break;
        }
        // Check again after a short delay to catch the update
        setTimeout(checkAllPermissions, 1000);
    };

    const PermissionItem = ({ title, description, status, type, icon: Icon }: any) => (
        <Card style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={[styles.iconContainer, { backgroundColor: (typeof status === 'boolean' ? status : status === 'granted') ? colors.success + '20' : colors.error + '20' }]}>
                    <Icon size={22} color={(typeof status === 'boolean' ? status : status === 'granted') ? colors.success : colors.error} />
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{title}</Text>
                    <Text style={styles.itemDescription}>{description}</Text>
                </View>
                <View style={styles.statusBadge}>
                    {getStatusIcon(status)}
                </View>
            </View>

            {((typeof status === 'boolean' && !status) || (typeof status === 'string' && status !== 'granted')) && (
                <Button
                    title="تفعيل الآن"
                    onPress={() => requestPermission(type)}
                    variant="outline"
                    size="sm"
                    style={styles.grantButton}
                />
            )}
        </Card>
    );

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={checkAllPermissions} />
            }
        >
            <Stack.Screen options={{
                title: "حالة الصلاحيات", headerRight: () => (
                    <TouchableOpacity onPress={checkAllPermissions} style={styles.headerButton}>
                        <RefreshCcw size={20} color={colors.primary} />
                    </TouchableOpacity>
                )
            }} />

            <View style={styles.content}>
                <View style={styles.infoBox}>
                    <ShieldCheck size={40} color={colors.primary} />
                    <Text style={styles.infoTitle}>إدارة الصلاحيات</Text>
                    <Text style={styles.infoText}>
                        يحتاج التطبيق لهذه الصلاحيات لضمان رنين المنبه في وقته وتدقيق تحديات الاستيقاظ بشكل صحيح.
                    </Text>
                </View>

                <PermissionItem
                    title="الإشعارات"
                    description="تنبيهك بموعد المنبه والأدوية"
                    status={statuses.notifications}
                    type="notifications"
                    icon={Bell}
                />

                <PermissionItem
                    title="الكاميرا"
                    description="مسح رموز QR لإيقاف المنبه"
                    status={statuses.camera}
                    type="camera"
                    icon={Camera}
                />

                <PermissionItem
                    title="الصور"
                    description="إضافة صور لعلب الأدوية"
                    status={statuses.photos}
                    type="photos"
                    icon={ImageIcon}
                />

                {Platform.OS === 'android' && (
                    <>
                        <PermissionItem
                            title="المنبهات الدقيقة"
                            description="لضمان الرنين في الثانية المحددة"
                            status={statuses.exactAlarm}
                            type="exactAlarm"
                            icon={Clock}
                        />

                        <PermissionItem
                            title="تحسين البطارية"
                            description="منع النظام من إغلاق التطبيق في الخلفية"
                            status={statuses.batteryOptimization}
                            type="battery"
                            icon={Battery}
                        />

                        <PermissionItem
                            title="الظهور فوق التطبيقات"
                            description="إظهار شاشة المنبه فوق أي تطبيق آخر"
                            status={statuses.overlay}
                            type="overlay"
                            icon={Layers}
                        />
                    </>
                )}

                <Button
                    title="فحص جميع الصلاحيات"
                    onPress={checkAllPermissions}
                    leftIcon={<RefreshCcw size={20} color="white" />}
                    style={styles.checkAllButton}
                />
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
        paddingBottom: 40,
    },
    headerButton: {
        padding: theme.spacing.sm,
    },
    infoBox: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        padding: theme.spacing.lg,
    },
    infoTitle: {
        fontSize: theme.typography.fontSizes.xl,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: theme.spacing.sm,
    },
    infoText: {
        textAlign: 'center',
        fontSize: theme.typography.fontSizes.md,
        color: colors.textSecondary,
        marginTop: theme.spacing.sm,
        lineHeight: 22,
    },
    itemCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: theme.typography.fontSizes.md,
        fontWeight: '600',
        color: colors.text,
    },
    itemDescription: {
        fontSize: theme.typography.fontSizes.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        marginLeft: theme.spacing.sm,
    },
    grantButton: {
        marginTop: theme.spacing.md,
    },
    checkAllButton: {
        marginTop: theme.spacing.lg,
    }
});
