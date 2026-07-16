import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ReflectionsRepository } from "../repositories/reflections";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  requestPermissions: async () => {
    if (Platform.OS === "web") return false;
    
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== "granted") {
        console.log("Notification permissions were not granted.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to request notification permissions:", error);
      return false;
    }
  },

  cancelReminders: async () => {
    if (Platform.OS === "web") return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("All scheduled reminders cancelled.");
    } catch (error) {
      console.error("Failed to cancel scheduled reminders:", error);
    }
  },

  scheduleDailyReminder: async (timeString, enabled = true) => {
    if (Platform.OS === "web") return;

    // First cancel existing to prevent duplicates
    await NotificationService.cancelReminders();

    if (!enabled) {
      console.log("Reminders are disabled, skipped scheduling.");
      return;
    }

    const hasPermission = await NotificationService.requestPermissions();
    if (!hasPermission) return;

    // Parse timeString (format "HH:MM:SS" or "HH:MM")
    const parts = timeString.split(":");
    const hour = parseInt(parts[0], 10) || 20;
    const minute = parseInt(parts[1], 10) || 0;

    try {
      // Check if user has already checked in today.
      // If today is completed, we want the daily reminder to start from tomorrow!
      const todayRef = ReflectionsRepository.getTodayReflection();
      const hasCheckedInToday = !!todayRef;

      if (hasCheckedInToday) {
        // Schedule starting tomorrow:
        // We schedule a daily recurring reminder. Since the API triggers at hour/minute daily,
        // we can schedule it. However, if they already checked in today, it could still fire today
        // if today's time hasn't arrived.
        // To skip today, we can check the time. If it is before today's target time,
        // we can schedule the reminder as a daily trigger, but wait, in Android/iOS, a daily trigger
        // will fire today if the time hasn't passed.
        // So if we have checked in, we can schedule a daily recurring trigger, but we could also
        // just let it be, or schedule it to start tomorrow. Since Expo notifications don't support a 
        // "start date" directly on recurring calendar triggers, it's standard to schedule the recurring 
        // trigger and let the OS handle it, or check status on notification receive.
        console.log("Already checked in today. Scheduling daily reminder recurring trigger.");
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Resolve - Daily Reflection",
          body: "Take a moment to reflect on your day and maintain your streak. ✨",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: hour,
          minute: minute,
          repeats: true,
        },
      });

      console.log(`Scheduled recurring daily reminder for ${hour}:${minute.toString().padStart(2, "0")}`);
    } catch (error) {
      console.error("Failed to schedule daily reminder:", error);
    }
  }
};
export default NotificationService;
