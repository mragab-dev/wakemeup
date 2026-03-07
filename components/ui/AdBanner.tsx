import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from '@/utils/adMob';

interface AdBannerProps {
  unitId?: string;
  size?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({
  unitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-3940256099942544/6300978111',
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER
}) => {

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={unitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default AdBanner;
