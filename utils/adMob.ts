import React from 'react';
import { Platform } from 'react-native';

// Mock types for web
const MockAdEventType = {
  LOADED: 'loaded',
  CLOSED: 'closed',
  ERROR: 'error',
};

const MockTestIds = {
  INTERSTITIAL: 'test-id',
  BANNER: 'test-id-banner',
};

class MockInterstitialAd {
  static createForAdRequest() {
    return new MockInterstitialAd();
  }
  addAdEventListener(event: string, callback: any) {
    return () => ({ remove: () => {} });
  }
  load() {}
  show() {}
}

class MockBannerAd extends React.Component<any> {
  render() {
    return null;
  }
}

const MockBannerAdSize = {
  BANNER: 'BANNER',
  FULL_BANNER: 'FULL_BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  SMART_BANNER: 'SMART_BANNER',
  WIDE_SKYSCRAPER: 'WIDE_SKYSCRAPER',
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
};

let AdMob: any;

if (Platform.OS === 'web') {
  AdMob = {
    InterstitialAd: MockInterstitialAd,
    BannerAd: MockBannerAd,
    BannerAdSize: MockBannerAdSize,
    AdEventType: MockAdEventType,
    TestIds: MockTestIds,
  };
} else {
  try {
    AdMob = require('react-native-google-mobile-ads');
  } catch (e) {
    // Fallback if module not found
    AdMob = {
      InterstitialAd: MockInterstitialAd,
      BannerAd: MockBannerAd,
      BannerAdSize: MockBannerAdSize,
      AdEventType: MockAdEventType,
      TestIds: MockTestIds,
    };
  }
}

export const { InterstitialAd, BannerAd, BannerAdSize, AdEventType, TestIds } = AdMob;
