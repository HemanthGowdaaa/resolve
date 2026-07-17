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
      console.log(`[NOTIFICATION] Foreground check: checked in today = ${hasCheckedInToday}`);
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
  initialize: async () => {
    if (Platform.OS === "web") return;

    console.log("[NOTIFICATION] Initializing service...");

    // Create default notification channel for Android compatibility
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Reminder Channel",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F71",
        });
        console.log("[NOTIFICATION] Android notification channel registered: default");
      } catch (err) {
        console.error("[NOTIFICATION] Failed to configure Android notification channel:", err.message);
      }
    }

    // Clean up old subscriptions to avoid duplicate listeners
    if (notificationSubscription) notificationSubscription.remove();
    if (responseSubscription) responseSubscription.remove();

    notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[NOTIFICATION] Notification Triggered in foreground:", notification.request.identifier);
    });

    responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[NOTIFICATION] Notification Clicked by user:", response.notification.request.identifier);
      NotificationService.handleNotificationResponse(response);
    });

    console.log("[NOTIFICATION] Service listeners initialized successfully.");
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
        console.log("[NOTIFICATION] Permission Denied - permissions disabled by user.");
        return false;
      }
      console.log("[NOTIFICATION] Permission Granted - delivery authorized.");
      return true;
    } catch (error) {
      console.error("[NOTIFICATION] Failed to request permissions:", error.message);
      return false;
    }
  },

  cancelReminder: async (id) => {
    if (Platform.OS === "web") return;
    try {
      console.log(`[NOTIFICATION] Cancelling rolling reminders for ID: ${id}`);
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const identifier = `reminder_${id}_day_${dayOffset}`;
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
      console.log(`[NOTIFICATION] Cancelled all rolling schedules for ID: ${id}`);
    } catch (error) {
      console.error(`[NOTIFICATION] Failed to cancel rolling schedules for ID ${id}:`, error.message);
    }
  },

  cancelAllReminderNotifications: async () => {
    if (Platform.OS === "web") return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("[NOTIFICATION] Cancelled all scheduled notifications in OS queue.");
    } catch (error) {
      console.error("[NOTIFICATION] Failed to clear OS notification queue:", error.message);
    }
  },

  scheduleDailyReminder: async (timeString, enabled = true) => {
    if (Platform.OS === "web") return;
    try {
      const { RemindersRepository } = require("../repositories/reminders");
      console.log(`[NOTIFICATION] Scheduling primary reminder to: ${timeString} | Enabled: ${enabled}`);
      await RemindersRepository.updateReminder("00000000-0000-0000-0000-000000000001", timeString, enabled);
      await NotificationService.scheduleAllReminders();
    } catch (error) {
      console.error("[NOTIFICATION] scheduleDailyReminder failed:", error.message);
    }
  },

  scheduleSecondaryReminder: async (timeString, enabled = true) => {
    if (Platform.OS === "web") return;
    try {
      const { RemindersRepository } = require("../repositories/reminders");
      console.log(`[NOTIFICATION] Scheduling secondary reminder to: ${timeString} | Enabled: ${enabled}`);
      await RemindersRepository.updateReminder("00000000-0000-0000-0000-000000000002", timeString, enabled);
      await NotificationService.scheduleAllReminders();
    } catch (error) {
      console.error("[NOTIFICATION] scheduleSecondaryReminder failed:", error.message);
    }
  },

  scheduleAllReminders: async () => {
    if (Platform.OS === "web") return;

    try {
      // 1. Cancel previous rolling notifications to prevent duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        console.log("[NOTIFICATION] Permission Denied - Skipping scheduling sequence.");
        return;
      }

      const { RemindersRepository } = require("../repositories/reminders");
      const reminder1 = RemindersRepository.getReminder1();
      const reminder2 = RemindersRepository.getReminder2();

      const todayRef = ReflectionsRepository.getTodayReflection();
      const hasCheckedInToday = !!todayRef;

      const scheduleReminderWindow = async (id, reminder, defaultTime) => {
        if (!reminder || reminder.enabled !== 1) {
          console.log(`[NOTIFICATION] Reminder ${id} is disabled, skipping scheduling.`);
          return;
        }

        const parts = (reminder.time || defaultTime).split(":");
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);

        const now = new Date();

        console.log(`[NOTIFICATION] Scheduling 7-day rolling window for reminder ${id} at ${hour}:${minute}`);

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const targetDate = new Date();
          targetDate.setDate(now.getDate() + dayOffset);
          targetDate.setHours(hour, minute, 0, 0);

          // Skip if trigger time has already passed today
          if (targetDate.getTime() <= now.getTime()) {
            continue;
          }

          // Skip today's reminder if user has already checked in today
          if (dayOffset === 0 && hasCheckedInToday) {
            console.log(`[NOTIFICATION] Omit: user checked in today, skipping trigger for today's reminder ${id}`);
            continue;
          }

          const identifier = `reminder_${id}_day_${dayOffset}`;
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
              title: "Resolve - Daily Reflection",
              body: "Take a moment to reflect on your day and maintain your streak. ✨",
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { screen: "Home" },
              channelId: "default",
            },
            trigger: {
              date: targetDate,
            },
          });
          console.log(`[NOTIFICATION] Scheduled rolling trigger: ${identifier} => ${targetDate.toLocaleString()}`);
        }
      };

      await scheduleReminderWindow("1", reminder1, "18:00:00");
      await scheduleReminderWindow("2", reminder2, "10:00:00");

      const pending = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`[NOTIFICATION] Rescheduled successfully. Active pending OS queue size: ${pending.length}`);

    } catch (error) {
      console.error("[NOTIFICATION] Failed to schedule rolling reminders:", error.message);
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
      console.error("[NOTIFICATION] Failed to query pending scheduled notifications:", error.message);
      return [];
    }
  },

  handleNotificationResponse: (response) => {
    try {
      const data = response.notification.request.content.data;
      if (data && data.screen) {
        console.log(`[NOTIFICATION] Click deep link redirection to: ${data.screen}`);
        navigate(data.screen);
      } else {
        navigate("Home");
      }
    } catch (error) {
      console.error("[NOTIFICATION] Error handling clicked response:", error.message);
    }
  }
};

export default NotificationService;
