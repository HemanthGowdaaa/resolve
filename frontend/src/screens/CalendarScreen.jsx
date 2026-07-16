import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { ReflectionsRepository } from "../repositories/reflections";
import { RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { Feather } from "../components/FeatherIcon";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const CalendarScreen = ({ navigation }) => {
  const { colors } = useTheme();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reflections, setReflections] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); // String YYYY-MM-DD
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [editText, setEditText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = () => {
    const list = ReflectionsRepository.getAll();
    setReflections(list);
  };

  const navigateMonth = (direction) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + direction);
    setCurrentDate(d);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDayPress = (dateStr) => {
    const ref = reflections.find((r) => r.date === dateStr);
    setSelectedDay(dateStr);
    setSelectedReflection(ref || null);
    setEditText(ref ? ref.reflection_text : "");
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleSaveReflection = () => {
    if (!editText.trim()) {
      Alert.alert("Error", "Reflection text cannot be empty.");
      return;
    }

    let result;
    if (selectedReflection) {
      // Update
      result = ReflectionsRepository.update(selectedReflection.id, editText);
    } else {
      // Create for selected custom date
      result = ReflectionsRepository.create(editText, selectedDay);
    }

    if (result) {
      loadData();
      setSelectedReflection(result);
      setIsEditing(false);
      setModalVisible(false);
    } else {
      Alert.alert("Error", "Failed to save reflection.");
    }
  };

  const handleDeleteReflection = () => {
    if (!selectedReflection) return;
    
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this reflection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const success = ReflectionsRepository.delete(selectedReflection.id);
            if (success) {
              loadData();
              setModalVisible(false);
            }
          }
        }
      ]
    );
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const activeDatesSet = new Set(reflections.map((r) => r.date));

  // Calendar cell builder
  const renderDays = () => {
    const cells = [];
    
    // Add empty padding for weekdays before month starts
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.cellEmpty} />);
    }

    // Add day cells
    const todayStr = new Date().toISOString().split("T")[0];
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      
      const isCompleted = activeDatesSet.has(dateStr);
      const isToday = dateStr === todayStr;
      const isFuture = new Date(dateStr) > new Date();

      let cellStyle = {};
      let textColor = colors.textPrimary;

      if (isCompleted) {
        cellStyle = { backgroundColor: colors.accent };
        textColor = "#FFFFFF";
      } else if (isToday) {
        cellStyle = { borderWidth: 1.5, borderColor: colors.primary };
        textColor = colors.primary;
      } else if (isFuture) {
        textColor = colors.textSecondary + "60";
      }

      cells.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[styles.cell, cellStyle]}
          disabled={isFuture}
          onPress={() => handleDayPress(dateStr)}
        >
          <Text style={[styles.cellText, { color: textColor }]}>{day}</Text>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  // Monthly stats calculations
  const getMonthlyStats = () => {
    let completedCount = 0;
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      if (activeDatesSet.has(dateStr)) {
        completedCount++;
      }
    }
    const rate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
    return { completedCount, rate };
  };

  const { completedCount, rate } = getMonthlyStats();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header Block */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Calendar</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Feather name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Month Navigator Header Card */}
        <Card style={styles.calendarCard}>
          <View style={styles.navigator}>
            <TouchableOpacity onPress={() => navigateMonth(-1)}>
              <Feather name="chevron-left" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)}>
              <Feather name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Titles Row */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={[styles.weekdayText, { color: colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Grid Layout Container */}
          <View style={styles.grid}>{renderDays()}</View>
        </Card>

        {/* Statistics Summary Card */}
        <Card style={styles.statsCard}>
          <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>Month Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{completedCount}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Days Completed</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{rate}%</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Success Rate</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Entry Inspector Modal overlay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {selectedDay ? new Date(selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : ""}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isEditing || !selectedReflection ? (
              <View style={styles.editSection}>
                <Input
                  placeholder="Record your achievements..."
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                />
                <Button title="Save Entry" onPress={handleSaveReflection} style={styles.modalBtn} />
              </View>
            ) : (
              <View style={styles.readSection}>
                <Text style={[styles.readBody, { color: colors.textPrimary }]}>
                  {selectedReflection.reflection_text}
                </Text>
                
                <View style={styles.readActions}>
                  <Button
                    title="Edit"
                    variant="outlined"
                    onPress={() => setIsEditing(true)}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Delete"
                    variant="outlined"
                    onPress={handleDeleteReflection}
                    style={[styles.actionBtn, { borderColor: colors.error }]}
                    textStyle={{ color: colors.error }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  },
  calendarCard: {
    paddingBottom: SPACING.lg,
  },
  navigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  monthLabel: {
    ...TYPOGRAPHY.sectionTitle,
    fontWeight: "bold",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  weekdayText: {
    width: "14.28%",
    textAlign: "center",
    ...TYPOGRAPHY.small,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
    borderRadius: RADIUS.calendarCell,
  },
  cellEmpty: {
    width: "14.28%",
    aspectRatio: 1,
  },
  cellText: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  statsCard: {
    marginTop: SPACING.md,
  },
  statsTitle: {
    ...TYPOGRAPHY.sectionTitle,
    fontWeight: "600",
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statCell: {
    alignItems: "center",
  },
  statVal: {
    ...TYPOGRAPHY.screenTitle,
    fontWeight: "bold",
  },
  statLbl: {
    ...TYPOGRAPHY.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.bottomSheet,
    borderTopRightRadius: RADIUS.bottomSheet,
    padding: SPACING.lg,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.cardTitle,
    fontWeight: "bold",
  },
  editSection: {
    width: "100%",
  },
  modalBtn: {
    marginTop: SPACING.sm,
  },
  readSection: {
    width: "100%",
  },
  readBody: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  readActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    width: "48%",
    height: 48,
  },
});

export default CalendarScreen;
