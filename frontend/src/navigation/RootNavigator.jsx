import React, { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { usePreferenceStore } from "../store/usePreferenceStore";
import { AuthNavigator } from "./AuthNavigator";
import { DrawerNavigator } from "./DrawerNavigator";
import SplashScreen from "../screens/SplashScreen";

export const RootNavigator = () => {
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const { hydrate: hydratePreferences } = usePreferenceStore();

  useEffect(() => {
    // Restore session credentials and preferences in parallel
    Promise.all([
      hydrate(),
      hydratePreferences()
    ]).then(() => {
      try {
        const { NotificationService } = require("../notifications/reminder");
        NotificationService.initialize();
        NotificationService.scheduleAllReminders();
      } catch (err) {
        console.warn("Failed to schedule reminders on start:", err.message);
      }
    });
  }, []);

  if (!isHydrated) {
    // Render splash screen while restoring session state
    return <SplashScreen />;
  }

  // Swap stacks atomically based on authentication state
  return isAuthenticated ? <DrawerNavigator /> : <AuthNavigator />;
};

export default RootNavigator;
