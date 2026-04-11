import AsyncStorage from "@react-native-async-storage/async-storage";

const EMAIL_PREFS_KEY = "email_preferences";

export const getEmailPreferences = async () => {
  try {
    const stored = await AsyncStorage.getItem(EMAIL_PREFS_KEY);
    if (!stored) {
      // Default: emails enabled
      return {
        reportConfirmations: true,
        dangerZoneAlerts: true,
        communityUpdates: false,
        email: null
      };
    }
    return JSON.parse(stored);
  } catch {
    return {
      reportConfirmations: true,
      dangerZoneAlerts: true,
      communityUpdates: false,
      email: null
    };
  }
};

export const setEmailPreferences = async (prefs) => {
  try {
    const current = await getEmailPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(EMAIL_PREFS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.log("Error setting email preferences:", error.message);
    throw error;
  }
};

export const getReportEmailEnabled = async () => {
  const prefs = await getEmailPreferences();
  return prefs.reportConfirmations;
};

export const setReportEmailEnabled = async (enabled) => {
  return setEmailPreferences({ reportConfirmations: enabled });
};

export const getDangerZoneEmailEnabled = async () => {
  const prefs = await getEmailPreferences();
  return prefs.dangerZoneAlerts;
};

export const setDangerZoneEmailEnabled = async (enabled) => {
  return setEmailPreferences({ dangerZoneAlerts: enabled });
};

export const setUserEmail = async (email) => {
  return setEmailPreferences({ email });
};

export const getUserEmail = async () => {
  const prefs = await getEmailPreferences();
  return prefs.email;
};
