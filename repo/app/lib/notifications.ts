import { Platform } from 'react-native';

// ─── Push Notification Utilities ─────────────────────────────────────
// Skeleton for expo-notifications integration.
// Install: npx expo install expo-notifications expo-device expo-constants

let Notifications: any = null;
let Device: any = null;
let Constants: any = null;

// Lazy-load to avoid crashes if not installed yet
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants');
} catch {
  // Dependencies not installed yet — functions will return gracefully
}

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Register for push notifications and return the Expo push token.
 * Returns null if permissions denied or not on a physical device.
 */
export async function registerForPushNotifications(): Promise<PushToken | null> {
  if (!Notifications || !Device) {
    console.warn('[notifications] expo-notifications or expo-device not installed');
    return null;
  }

  // Must be a physical device
  if (!Device.isDevice) {
    console.warn('[notifications] Push notifications require a physical device');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[notifications] Permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    console.log('[notifications] Push token:', tokenData.data);

    return {
      token: tokenData.data,
      platform,
    };
  } catch (error) {
    console.error('[notifications] Failed to get push token:', error);
    return null;
  }
}

/**
 * Configure notification handler for foreground notifications.
 */
export function configureForegroundNotifications(): void {
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Set up Android notification channel (required for Android 8+).
 */
export async function setupAndroidChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'TennisHQ',
    importance: Notifications.AndroidImportance?.MAX ?? 4,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#16a34a',
  });
}

/**
 * Schedule a local notification (useful for testing).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number = 1
): Promise<string | null> {
  if (!Notifications) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: { seconds },
  });

  return id;
}

/**
 * Add a listener for received notifications (foreground).
 */
export function addNotificationListener(
  callback: (notification: any) => void
): (() => void) | null {
  if (!Notifications) return null;

  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Add a listener for notification responses (user tapped notification).
 */
export function addNotificationResponseListener(
  callback: (response: any) => void
): (() => void) | null {
  if (!Notifications) return null;

  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Initialize all notification infrastructure.
 * Call this once in your root layout or app entry.
 */
export async function initNotifications(): Promise<PushToken | null> {
  configureForegroundNotifications();
  await setupAndroidChannel();
  return registerForPushNotifications();
}
