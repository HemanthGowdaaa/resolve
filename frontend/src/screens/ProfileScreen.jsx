import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Share,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/useAuthStore";
import { usePreferenceStore } from "../store/usePreferenceStore";
import { useTheme } from "../providers/ThemeProvider";
import { ReflectionsRepository } from "../repositories/reflections";
import { RemindersRepository } from "../repositories/reminders";
import { calculateLocalStreak } from "../utils/streakCalculator";
import { NotificationService } from "../notifications/reminder";
import { SyncManager } from "../sync/syncManager";
import { ExportService } from "../services/export";
import { RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { Feather } from "../components/FeatherIcon";

export const ProfileScreen = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { 
    reminderTime, 
    setReminderTime, 
    lastSyncTime, 
    setThemeDark 
  } = usePreferenceStore();

  const [reminder1Enabled, setReminder1Enabled] = useState(true);
  const [time1Input, setTime1Input] = useState("18:00");
  const [reminder2Enabled, setReminder2Enabled] = useState(false);
  const [time2Input, setTime2Input] = useState("10:00");
  
  // Local Stats State
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalCount: 0,
    completionRate: 0,
  });

  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadProfileData();
    });
    loadProfileData();
    return unsubscribe;
  }, [navigation]);

  const loadProfileData = () => {
    // 1. Load local reminder config
    const r1 = RemindersRepository.getReminder1();
    if (r1) {
      setReminder1Enabled(r1.enabled === 1);
      setTime1Input(r1.time.substring(0, 5));
    }
    const r2 = RemindersRepository.getReminder2();
    if (r2) {
      setReminder2Enabled(r2.enabled === 1);
      setTime2Input(r2.time.substring(0, 5));
    }

    // 2. Load and compute local stats
    const reflections = ReflectionsRepository.getAll();
    const streaks = calculateLocalStreak(reflections);
    
    // Compute last 30 days completion rate
    const today = new Date();
    let completedRecent = 0;
    const activeDatesSet = new Set(reflections.map((r) => r.date));
    
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (activeDatesSet.has(dateStr)) {
        completedRecent++;
      }
    }
    const rate = Math.round((completedRecent / 30.0) * 100);

    setStats({
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      totalCount: reflections.length,
      completionRate: rate,
    });
  };

  const handleToggleTheme = () => {
    toggleTheme();
    setThemeDark(!isDark);
  };

  const handleSaveReminderSettings = async () => {
    // Validate HH:MM time format
    const timeReg = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeReg.test(time1Input) || !timeReg.test(time2Input)) {
      Alert.alert("Invalid Time", "Please enter time in HH:MM format (e.g. 18:00 or 10:00)");
      return;
    }

    // Save in local SQLite
    const updated1 = RemindersRepository.updateReminder(
      "00000000-0000-0000-0000-000000000001",
      `${time1Input}:00`,
      reminder1Enabled
    );

    const updated2 = RemindersRepository.updateReminder(
      "00000000-0000-0000-0000-000000000002",
      `${time2Input}:00`,
      reminder2Enabled
    );

    if (updated1 && updated2) {
      setReminderTime(time1Input); // Sync fallback settings
      
      // Update system reminder channel
      await NotificationService.scheduleAllReminders();
      Alert.alert("Success", "Reminder settings saved successfully.");
    } else {
      Alert.alert("Error", "Failed to update reminder settings.");
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    const result = await SyncManager.runSync();
    setSyncing(false);
    
    if (result.success) {
      loadProfileData();
      Alert.alert("Sync Successful", "Your reflections data is merged with the cloud.");
    } else {
      Alert.alert("Sync Failed", "Could not synchronize. Check your network connection.");
    }
  };

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const data = await ExportService.exportJson();
      await Share.share({
        message: typeof data === "object" ? JSON.stringify(data, null, 2) : data,
        title: "Resolve Backup Data",
      });
    } catch (error) {
      Alert.alert("Export Failed", "Could not compile JSON export file.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const csvStr = await ExportService.exportCsv();
      await Share.share({
        message: csvStr,
        title: "Resolve CSV Export",
      });
    } catch (error) {
      Alert.alert("Export Failed", "Could not compile CSV export file.");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "Never";
    return new Date(isoStr).toLocaleString();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header Block */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Feather name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.full_name?.substring(0, 2).toUpperCase() || "RE"}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.full_name || "Account Owner"}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || "user@example.com"}
          </Text>
        </Card>

        {/* Stats Grid Card */}
        <Card style={styles.statsCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Achievements</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{stats.currentStreak}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Current Streak</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{stats.longestStreak}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Longest Streak</Text>
            </View>
          </View>
          <View style={[styles.statsGrid, { marginTop: SPACING.md }]}>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{stats.totalCount}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Total Reflections</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{stats.completionRate}%</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>30-Day Rate</Text>
            </View>
          </View>
        </Card>

        {/* Sync & Preferences Card */}
        <Card style={styles.prefCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferences</Text>
          
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
            <Switch value={isDark} onValueChange={handleToggleTheme} />
          </View>

          <View style={styles.divider} />

          <Text style={[styles.rowLabel, { color: colors.textPrimary, marginBottom: SPACING.xs }]}>
            Daily Reminders
          </Text>

          {/* Reminder 1: Primary Evening */}
          <View style={styles.row}>
            <Text style={[styles.rowSubLabel, { color: colors.textSecondary }]}>Primary Evening (e.g. 18:00)</Text>
            <Switch value={reminder1Enabled} onValueChange={setReminder1Enabled} />
          </View>
          <View style={[styles.timeRow, { marginBottom: SPACING.md }]}>
            <Input
              label="Time (HH:MM)"
              placeholder="e.g. 18:00"
              value={time1Input}
              onChangeText={setTime1Input}
              style={styles.timeInput}
              disabled={!reminder1Enabled}
            />
          </View>

          <View style={styles.divider} />

          {/* Reminder 2: Secondary Morning */}
          <View style={styles.row}>
            <Text style={[styles.rowSubLabel, { color: colors.textSecondary }]}>Secondary Morning (e.g. 10:00)</Text>
            <Switch value={reminder2Enabled} onValueChange={setReminder2Enabled} />
          </View>
          <View style={styles.timeRow}>
            <Input
              label="Time (HH:MM)"
              placeholder="e.g. 10:00"
              value={time2Input}
              onChangeText={setTime2Input}
              style={styles.timeInput}
              disabled={!reminder2Enabled}
            />
          </View>

          <Button
            title="Save Reminder Settings"
            onPress={handleSaveReminderSettings}
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        {/* Sync Data Block */}
        <Card style={styles.dataCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Synchronization</Text>
          <Text style={[styles.syncLog, { color: colors.textSecondary }]}>
            Last synced: {formatDate(lastSyncTime)}
          </Text>
          <Button
            title={syncing ? "Syncing..." : "Sync Now"}
            onPress={handleSyncNow}
            loading={syncing}
            style={styles.dataBtn}
          />
        </Card>

        {/* Export Data Block */}
        <Card style={styles.dataCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Export Data</Text>
          <View style={styles.exportRow}>
            <Button
              title="Export JSON"
              variant="outlined"
              onPress={handleExportJson}
              loading={exporting}
              style={styles.exportBtn}
            />
            <Button
              title="Export CSV"
              variant="outlined"
              onPress={handleExportCsv}
              loading={exporting}
              style={styles.exportBtn}
            />
          </View>
        </Card>

        <Button
          title="Sign Out"
          onPress={() => logout()}
          variant="secondary"
          style={styles.signOutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.cardTitle,
    fontSize: 20,
    fontWeight: "bold",
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  userCard: {
    alignItems: "center",
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  userName: {
    ...TYPOGRAPHY.cardTitle,
    fontWeight: "700",
    marginBottom: 2,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
  },
  statsCard: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    fontWeight: "600",
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCell: {
    width: "48%",
    alignItems: "center",
  },
  statVal: {
    ...TYPOGRAPHY.screenTitle,
    fontSize: 22,
    fontWeight: "bold",
  },
  statLbl: {
    ...TYPOGRAPHY.small,
  },
  prefCard: {
    marginTop: SPACING.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: SPACING.xs,
  },
  rowLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: "500",
  },
  rowSubLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: SPACING.md,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  timeInput: {
    flex: 1,
    marginVertical: 0,
  },
  timeSaveBtn: {
    width: 110,
    height: 48,
    marginLeft: SPACING.md,
    marginVertical: 0,
  },
  dataCard: {
    marginTop: SPACING.md,
  },
  syncLog: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.md,
  },
  dataBtn: {
    marginVertical: 0,
  },
  exportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exportBtn: {
    width: "48%",
    marginVertical: 0,
  },
  signOutBtn: {
    marginTop: SPACING.xl,
    backgroundColor: "#FCA5A5",
  },
});

export default ProfileScreen;
