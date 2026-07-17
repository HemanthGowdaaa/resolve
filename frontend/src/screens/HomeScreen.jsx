import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/useAuthStore";
import { useTheme } from "../providers/ThemeProvider";
import { ReflectionsRepository } from "../repositories/reflections";
import { calculateLocalStreak } from "../utils/streakCalculator";
import { SyncManager } from "../sync/syncManager";
import { RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { Feather } from "../components/FeatherIcon";

const QUOTES = [
  { text: "Consistency creates greatness.", author: "Anonymous" },
  { text: "Discipline beats motivation.", author: "Anonymous" },
  { text: "Small progress every day.", author: "Anonymous" },
  { text: "Never give up.", author: "Anonymous" },
  { text: "Atomic habits yield massive compound results.", author: "James Clear" }
];

export const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  
  const [reflections, setReflections] = useState([]);
  const [todayReflection, setTodayReflection] = useState(null);
  const [reflectionText, setReflectionText] = useState("");
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load SQLite data
  const loadData = () => {
    const list = ReflectionsRepository.getAll();
    setReflections(list);

    const todayRef = ReflectionsRepository.getTodayReflection();
    setTodayReflection(todayRef);
    if (todayRef) {
      setReflectionText(todayRef.reflection_text);
    } else {
      setReflectionText("");
    }

    const streaks = calculateLocalStreak(list);
    setStreakData(streaks);
  };

  useEffect(() => {
    loadData();
    
    // Trigger background sync on screen focus
    triggerSync();
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    const syncRes = await SyncManager.runSync();
    if (syncRes.success) {
      loadData(); // Reload data if updates fetched
    }
    setSyncing(false);
  };

  // Greeting based on hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get daily quote
  const getDailyQuote = () => {
    const idx = new Date().getDate() % QUOTES.length;
    return QUOTES[idx];
  };

  const handleCheckIn = () => {
    if (!reflectionText.trim()) {
      Alert.alert("Error", "Reflection text cannot be empty.");
      return;
    }
    
    setLoading(true);
    
    let result;
    if (todayReflection) {
      // Update today's reflection
      result = ReflectionsRepository.update(todayReflection.id, reflectionText);
    } else {
      // Create new reflection
      result = ReflectionsRepository.create(reflectionText);
    }

    if (result) {
      loadData();
      Alert.alert("Success", todayReflection ? "Reflection updated." : "Checked in! Keep up the consistency. ✨");
      
      // Reschedule reminders to skip today's triggers since check-in is complete
      try {
        const { NotificationService } = require("../notifications/reminder");
        NotificationService.scheduleAllReminders();
      } catch (err) {
        console.warn("Failed to reschedule reminders after check-in:", err.message);
      }

      // Trigger background sync in the background
      SyncManager.runSync().then((res) => {
        if (res.success) loadData();
      });
    } else {
      Alert.alert("Error", "Failed to save reflection.");
    }
    setLoading(false);
  };

  const handleDeleteReflection = () => {
    if (!todayReflection) return;
    
    Alert.alert(
      "Delete Reflection",
      "Are you sure you want to delete today's reflection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const success = ReflectionsRepository.delete(todayReflection.id);
            if (success) {
              loadData();

              // Reschedule reminders to restore today's triggers since check-in was deleted
              try {
                const { NotificationService } = require("../notifications/reminder");
                NotificationService.scheduleAllReminders();
              } catch (err) {
                console.warn("Failed to reschedule reminders after delete:", err.message);
              }

              SyncManager.runSync().then((res) => {
                if (res.success) loadData();
              });
            }
          }
        }
      ]
    );
  };

  // Compile calendar checkmarks for the last 14 days
  const renderCalendarDots = () => {
    const dots = [];
    const activeDatesSet = new Set(reflections.map((r) => r.date));
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      const isCompleted = activeDatesSet.has(dateStr);
      const isToday = i === 0;

      let dotBg = colors.border;
      if (isCompleted) {
        dotBg = colors.accent; // Green
      } else if (isToday) {
        dotBg = colors.warning + "40"; // Light yellow outline/shade
      }

      dots.push(
        <View key={dateStr} style={styles.calendarDayWrapper}>
          <View style={[styles.calendarDot, { backgroundColor: dotBg }]} />
          <Text style={[styles.calendarDayText, { color: colors.textSecondary }]}>
            {d.getDate()}
          </Text>
        </View>
      );
    }
    return dots;
  };

  const quote = getDailyQuote();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        {/* Header Block */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Feather name="compass" size={24} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Resolve</Text>
          </View>
          <View style={styles.headerRight}>
            {syncing && (
              <Feather name="refresh-cw" size={18} color={colors.primary} style={styles.syncIcon} />
            )}
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <Feather name="menu" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting Card */}
          <View style={styles.greetingSection}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.full_name || "Self Improver"}
            </Text>
          </View>

          {/* Streak Card */}
          <Card style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={[styles.streakNumber, { color: colors.textPrimary }]}>
              {streakData.currentStreak} Days
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Current Streak</Text>
            
            <View style={styles.streakDetails}>
              <View style={styles.streakDetailCell}>
                <Text style={[styles.streakDetailVal, { color: colors.textPrimary }]}>
                  {streakData.longestStreak}
                </Text>
                <Text style={[styles.streakDetailLbl, { color: colors.textSecondary }]}>Longest Streak</Text>
              </View>
            </View>
          </Card>

          {/* Compact Calendar Grid Card */}
          <Card style={styles.calendarCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Check-Ins</Text>
            <View style={styles.calendarGrid}>{renderCalendarDots()}</View>
          </Card>

          {/* Reflection Card */}
          <Card style={styles.reflectionCard}>
            <View style={styles.reflectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {todayReflection ? "Today's Reflection" : "Check In for Today"}
              </Text>
              {todayReflection && (
                <TouchableOpacity onPress={handleDeleteReflection}>
                  <Feather name="trash-2" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            <Input
              placeholder="What did you accomplish today?"
              value={reflectionText}
              onChangeText={setReflectionText}
              multiline
              maxLength={1000}
              style={styles.reflectionInput}
            />

            <View style={styles.reflectionFooter}>
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {reflectionText.length}/1000 characters
              </Text>
              <Button
                title={todayReflection ? "Update Reflection" : "Check In"}
                onPress={handleCheckIn}
                loading={loading}
                style={styles.saveBtn}
              />
            </View>
          </Card>

          {/* Daily Quote Card */}
          <Card style={styles.quoteCard}>
            <Feather name="quote" size={24} color={colors.primary + "80"} style={styles.quoteIcon} />
            <Text style={[styles.quoteText, { color: colors.textPrimary }]}>"{quote.text}"</Text>
            <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>— {quote.author}</Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    ...TYPOGRAPHY.cardTitle,
    fontSize: 20,
    marginLeft: SPACING.sm,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  syncIcon: {
    marginRight: SPACING.md,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  greetingSection: {
    marginBottom: SPACING.lg,
  },
  greeting: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
  },
  userName: {
    ...TYPOGRAPHY.screenTitle,
    fontSize: 26,
    fontWeight: "800",
  },
  streakCard: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: SPACING.xs,
  },
  streakNumber: {
    ...TYPOGRAPHY.screenTitle,
    fontWeight: "bold",
    marginBottom: 2,
  },
  streakLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "500",
    marginBottom: SPACING.md,
  },
  streakDetails: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    width: "100%",
    paddingTop: SPACING.md,
    justifyContent: "center",
  },
  streakDetailCell: {
    alignItems: "center",
  },
  streakDetailVal: {
    ...TYPOGRAPHY.cardTitle,
    fontWeight: "700",
  },
  streakDetailLbl: {
    ...TYPOGRAPHY.small,
  },
  calendarCard: {
    paddingBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    fontWeight: "600",
    marginBottom: SPACING.md,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  calendarDayWrapper: {
    alignItems: "center",
    width: "14%",
    marginBottom: SPACING.sm,
  },
  calendarDot: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.calendarCell,
    marginBottom: SPACING.xs,
  },
  calendarDayText: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    fontWeight: "600",
  },
  reflectionCard: {
    paddingBottom: SPACING.md,
  },
  reflectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reflectionInput: {
    marginVertical: 0,
  },
  reflectionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  charCount: {
    ...TYPOGRAPHY.small,
  },
  saveBtn: {
    maxWidth: 160,
    marginVertical: 0,
    height: 44,
  },
  quoteCard: {
    alignItems: "center",
    padding: SPACING.xl,
  },
  quoteIcon: {
    marginBottom: SPACING.sm,
  },
  quoteText: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  quoteAuthor: {
    ...TYPOGRAPHY.caption,
    fontWeight: "500",
  },
});

export default HomeScreen;
