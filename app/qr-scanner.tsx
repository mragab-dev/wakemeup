
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Zap, Target } from 'lucide-react-native';
import { useSettingsStore } from '@/store/settingsStore';
import Button from '@/components/ui/Button';

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const { returnPath, ...restParams } = useLocalSearchParams();

  const [scanned, setScanned] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    router.replace({
      pathname: (returnPath || '/') as any,
      params: { ...restParams, scannedData: data },
    });
  };

  const handleClose = () => {
    router.replace({
      pathname: (returnPath || '/') as any,
      params: restParams,
    });
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{t('medicationForm.cameraAccessMessage')}</Text>
        <Button title={t('grantPermission')} onPress={() => {
          Linking.openSettings();
        }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={32} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <Target size={200} color="rgba(255, 255, 255, 0.5)" />
          </View>
          <Text style={styles.scanText}>{t('pointCameraAtQR')}</Text>
        </View>

        <View style={styles.footer} />
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    color: 'white',
    fontSize: theme.typography.fontSizes.lg,
    marginTop: theme.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  footer: {
    height: 100,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: colors.background,
  },
  permissionText: {
    fontSize: theme.typography.fontSizes.lg,
    color: colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
});
