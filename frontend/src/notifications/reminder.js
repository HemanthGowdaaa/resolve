import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ReflectionsRepository } from "../repositories/reflections";
import { navigate } from "../navigation/navigationRef";

Notifications.setNotificationHandler({
  handleNotification: async () => {
    // Dynamic suppression in foreground if already checked in today
    try {
      const todayRef = ReflectionsRepository.getTodayReflection();
      const hasCheckedInToday = !!todayRef;
      return {
        shouldShowAlert: !hasCheckedInToday,
        shouldPlaySound: !hasCheckedInToday,
        shouldSetBadge: !hasCheckedInToday,
      };
    } catch (e) {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    }
  },
});

let notificationSubscription;
let responseSubscription;

export const NotificationService = {
  initialize: () => {
    if (Platform.OS === "web") return;

    // Clean up old subscriptions to avoid duplicates
    if (notificationSubscription) notificationSubscription.remove();
    if (responseSubscription) responseSubscription.remove();

    notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[NOTIFICATIONS] Notification received in foreground:", notification);
    });

    responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[NOTIFICATIONS] Notification clicked by user:", response);
      NotificationService.handleNotificationResponse(response);
    });

    console.log("[NOTIFICATIONS] Service listeners initialized.");
  },

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
        console.log("[NOTIFICATIONS] Permission Denied - permissions disabled by user.");
        return false;
      }
      console.log("[NOTIFICATIONS] Permission Granted - notification delivery enabled.");
      return true;
    } catch (error) {
      console.error("[NOTIFICATIONS] Failed to request notification permissions:", error);
      return false;
    }
  },

  cancelReminder: async (id) => {
    if (Platform.OS === "web") return;
    try {
      await Notifications.cancelScheduledNotificationAsync(`reminder_${id}`);
      console.log(`[NOTIFICATIONS] Cancelled reminder ${id}`);
    } catch (error) {
      console.error(`[NOTIFICATIONS] Failed to cancel reminder ${id}:`, error);
    }
  },

  cancelAllReminderNotifications: async () => {
    if (Platform.OS === "web") return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("[NOTIFICATIONS] Cancelled all scheduled notifications");
    } catch (error) {
      console.error("[NOTIFICATIONS] Failed to cancel all scheduled notifications:", error);
    }
  },

  scheduleDailyReminder: async (timeString, enabled = true) => {
    if (Platform.OS === "web") return;
    try {
      const { RemindersRepository } = require("../repositories/reminders");
      await RemindersRepository.updateReminder("00000000-0000-0000-0000-000000000001", timeString, enabled);
      await NotificationService.scheduleAllReminders();
    } catch (error) {
      console.error("[NOTIFICATIONS] scheduleDailyReminder failed:", error);
    }
  },

  scheduleSecondaryReminder: async (timeString, enabled = true) => {
    if (Platform.OS === "web") return;
    try {
      const { RemindersRepository } = require("../repositories/reminders");
      await RemindersRepository.updateReminder("00000000-0000-0000-0000-000000000002", timeString, enabled);
      await NotificationService.scheduleAllReminders();
    } catch (error) {
      console.error("[NOTIFICATIONS] scheduleSecondaryReminder failed:", error);
    }
  },

  scheduleAllReminders: async () => {
    if (Platform.OS === "web") return;

    try {
      // 1. Cancel previous to avoid duplicate triggers
      await Notifications.cancelAllScheduledNotificationsAsync();

      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        console.log("[NOTIFICATIONS] Permission Denied - Skipping scheduling.");
        return;
      }

      const { RemindersRepository } = require("../repositories/reminders");
      const reminder1 = RemindersRepository.getReminder1();
      const reminder2 = RemindersRepository.getReminder2();

      const todayRef = ReflectionsRepository.getTodayReflection();
      const hasCheckedInToday = !!todayRef;

      const scheduleReminder = async (id, reminder, defaultTime) => {
        if (!reminder || reminder.enabled !== 1) {
          console.log(`[NOTIFICATIONS] Notification Cancelled - Reminder ${id} is disabled, skipping.`);
          return;
        }

        const parts = (reminder.time || defaultTime).split(":");
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);

        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        // Check if the trigger time is upcoming today
        const isUpcomingToday = currentHour < hour || (currentHour === hour && currentMin < minute);

        if (hasCheckedInToday && isUpcomingToday) {
          // Trigger tomorrow (one-time) so it skips today
          const tomorrow = new Date();
          tomorrow.setDate(now.getDate() + 1);
          
          await Notifications.scheduleNotificationAsync({
            identifier: `reminder_${id}`,
            content: {
              title: "Resolve - Daily Reflection",
              body: "Take a moment to reflect on your day and maintain your streak. ✨",
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { screen: "Home" }
            },
            trigger: {
              date: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), hour, minute, 0),
            },
          });
          console.log(`[NOTIFICATIONS] Notification Scheduled - skipped-today reminder ${id} for tomorrow at ${hour}:${minute}`);
        } else {
          // Regular daily repeating trigger
          await Notifications.scheduleNotificationAsync({
            identifier: `reminder_${id}`,
            content: {
              title: "Resolve - Daily Reflection",
              body: "Take a moment to reflect on your day and maintain your streak. ✨",
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { screen: "Home" }
            },
            trigger: {
              hour: hour,
              minute: minute,
              repeats: true,
            },
          });
          console.log(`[NOTIFICATIONS] Notification Scheduled - daily repeating reminder ${id} for ${hour}:${minute}`);
        }
      };

      await scheduleReminder("1", reminder1, "18:00:00");
      await scheduleReminder("2", reminder2, "10:00:00");

    } catch (error) {
      console.error("Failed to schedule all reminders:", error);
    }
  },

  rescheduleAll: async () => {
    await NotificationService.scheduleAllReminders();
  },

  getPendingNotifications: async () => {
    if (Platform.OS === "web") return [];
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("[NOTIFICATIONS] Failed to query pending scheduled notifications:", error);
      return [];
    }
  },

  handleNotificationResponse: (response) => {
    try {
      const data = response.notification.request.content.data;
      if (data && data.screen) {
        console.log(`[NOTIFICATIONS] Deep linking to screen: ${data.screen}`);
        navigate(data.screen);
      } else {
        navigate("Home");
      }
    } catch (error) {
      console.error("[NOTIFICATIONS] Error handling notification response:", error);
    }
  }
};

export default NotificationService;
