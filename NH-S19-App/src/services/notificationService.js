import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// 1. Notification Behavior Configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Banner dikhane ke liye zaroori hai
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let initialized = false;
const CHANNEL_ID = "risk-alerts";

export const initializeNotifications = async () => {
  if (initialized) return true;

  try {
    // 2. Android Channel Setup (Critical for High Priority)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Dengue Risk Alerts",
        importance: Notifications.AndroidImportance.MAX, // Max for heads-up banner
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#F5A300",
        enableVibrate: true,
        showBadge: true,
      });
    }

    // 3. Permission Management
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted!");
      return false;
    }

    initialized = true;
    return true;
  } catch (error) {
    console.error("Notification Init Error:", error);
    return false;
  }
};

/**
 * Sends a local notification.
 * High priority notifications will use the 'risk-alerts' channel.
 */
export const sendLocalNotification = async ({ title, body, data = {}, highPriority = false }) => {
  const isReady = await initializeNotifications();
  if (!isReady) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || "Dengue Watch Update",
      body: body || "New risk data available in your area.",
      data: data,
      // 🔥 Sabse Imp Fix: Android ke liye channelId match honi chahiye
      ...(Platform.OS === "android" && {
        priority: highPriority ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.DEFAULT,
        channelId: CHANNEL_ID,
      }),
      sound: true, // Emergency alerts ke liye sound ON rakhna behtar hai
    },
    trigger: null, // Instant trigger
  });
};

/**
 * Notification Interaction Listener
 * Use this in your App.js or MainNavigator to handle taps.
 */
export const setupNotificationResponseListener = (callback) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (callback) callback(data);
  });
  return subscription;
};