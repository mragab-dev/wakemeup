import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from '@/utils/adMob';

interface AdBannerProps {
  unitId?: string;
  size?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({
  unitId = 'ca-app-pub-5644089575101992/3417201131',
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
