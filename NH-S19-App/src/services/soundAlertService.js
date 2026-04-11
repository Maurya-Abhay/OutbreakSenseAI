import { Vibration, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";

// Global tracking
let isPlaying = false;
let alertTimeout = null;
let soundAlertEnabled = true;
let alertToneMode = "alarm";
let currentSound = null;
const SOUND_ALERT_PREF_KEY = "sound_alert_enabled";
const SOUND_ALERT_TONE_MODE_KEY = "sound_alert_tone_mode";

const ALERT_TONE_SOURCE = {
  alarm: require("../../assets/sounds/danger_siren.mp3"),
  beep: require("../../assets/sounds/danger_beep.mp3"),
};

/**
 * Initialize audio for alert system
 */
export const initializeAudioSystem = async () => {
  try {
    const stored = await AsyncStorage.getItem(SOUND_ALERT_PREF_KEY);
    const storedMode = await AsyncStorage.getItem(SOUND_ALERT_TONE_MODE_KEY);
    if (stored === "false") {
      soundAlertEnabled = false;
    } else {
      soundAlertEnabled = true;
    }
    if (storedMode === "vibrate" || storedMode === "alarm" || storedMode === "beep") {
      alertToneMode = storedMode;
    } else {
      alertToneMode = "alarm";
    }
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
    });
    console.log("Audio system initialized (using vibration)");
  } catch (error) {
    console.log("Error initializing audio:", error.message);
  }
};

export const isSoundAlertEnabled = async () => {
  try {
    const stored = await AsyncStorage.getItem(SOUND_ALERT_PREF_KEY);
    if (stored === null) {
      soundAlertEnabled = true;
      return true;
    }
    soundAlertEnabled = stored !== "false";
    return soundAlertEnabled;
  } catch {
    return soundAlertEnabled;
  }
};

export const setSoundAlertEnabled = async (enabled) => {
  const next = Boolean(enabled);
  soundAlertEnabled = next;
  await AsyncStorage.setItem(SOUND_ALERT_PREF_KEY, next ? "true" : "false");
  if (!next) {
    await stopAlert();
  }
  return next;
};

export const getAlertToneMode = async () => {
  try {
    const storedMode = await AsyncStorage.getItem(SOUND_ALERT_TONE_MODE_KEY);
    if (storedMode === "vibrate" || storedMode === "alarm" || storedMode === "beep") {
      alertToneMode = storedMode;
      return storedMode;
    }
    return "alarm";
  } catch {
    return alertToneMode;
  }
};

export const setAlertToneMode = async (mode) => {
  const nextMode = mode === "vibrate" || mode === "beep" ? mode : "alarm";
  alertToneMode = nextMode;
  await AsyncStorage.setItem(SOUND_ALERT_TONE_MODE_KEY, nextMode);
  return nextMode;
};

const playAudioTone = async (mode) => {
  const source = ALERT_TONE_SOURCE[mode] || ALERT_TONE_SOURCE.alarm;

  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {}
    currentSound = null;
  }

  const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true, volume: 1.0 });
  currentSound = sound;
};

/**
 * Play high alert sound (danger zone detected)
 */
export const playHighAlert = async () => {
  const enabled = await isSoundAlertEnabled();
  if (!enabled) return;
  if (isPlaying) return; // Prevent multiple sounds

  try {
    isPlaying = true;

    const mode = await getAlertToneMode();

    // Alarm mode: stronger vibration + local notification sound
    const pattern =
      mode === "alarm"
        ? Platform.OS === "android"
          ? [0, 450, 120, 450, 120, 450, 120, 700]
          : [0, 1200]
        : mode === "beep"
          ? Platform.OS === "android"
            ? [0, 220, 90, 220]
            : [0, 400]
        : Platform.OS === "android"
          ? [0, 300, 100, 300, 100, 300, 100, 500]
          : [0, 1000];

    Vibration.vibrate(pattern);

    if (mode === "alarm" || mode === "beep") {
      try {
        await playAudioTone(mode);
      } catch (e) {
        console.log("Audio tone playback failed:", e?.message);
      }
    }

    // Schedule the alert to stop after 5 seconds
    if (alertTimeout) clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      stopAlert();
    }, 5000);
  } catch (error) {
    console.log("Error playing alert:", error.message);
    isPlaying = false;
  }
};

/**
 * Stop the alert sound
 */
export const stopAlert = async () => {
  try {
    isPlaying = false;

    if (alertTimeout) {
      clearTimeout(alertTimeout);
      alertTimeout = null;
    }

    // Stop vibration
    try {
      Vibration.cancel();
    } catch {}

    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch {}
      currentSound = null;
    }
  } catch (error) {
    console.log("Error stopping alert:", error.message);
  }
};

/**
 * Check if sound is currently playing
 */
export const isAlertPlaying = () => isPlaying;

/**
 * Cleanup audio resources
 */
export const cleanupAudioSystem = async () => {
  try {
    isPlaying = false;
    
    if (alertTimeout) {
      clearTimeout(alertTimeout);
      alertTimeout = null;
    }

    Vibration.cancel();

    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch {}
      currentSound = null;
    }
  } catch (error) {
    console.log("Error cleaning up audio:", error.message);
  }
};
