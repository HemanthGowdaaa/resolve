import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { ReflectionsRepository } from "../repositories/reflections";
import { RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import EmptyState from "../components/EmptyState";
import { Feather } from "../components/FeatherIcon";

export const HistoryScreen = ({ navigation }) => {
  const { colors, shadows } = useTheme();
  
  const [reflections, setReflections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [editText, setEditText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleEditPress = (ref) => {
    setSelectedReflection(ref);
    setEditText(ref.reflection_text);
    setModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) {
      Alert.alert("Error", "Reflection text cannot be empty.");
      return;
    }

    const success = ReflectionsRepository.update(selectedReflection.id, editText);
    if (success) {
      loadData();
      setModalVisible(false);
    } else {
      Alert.alert("Error", "Failed to update reflection.");
    }
  };

  const handleDeletePress = (id) => {
    Alert.alert(
      "Delete Reflection",
      "Are you sure you want to delete this reflection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const success = ReflectionsRepository.delete(id);
            if (success) {
              loadData();
            }
          }
        }
      ]
    );
  };

  // Filter list based on search bar
  const getFilteredReflections = () => {
    if (!searchQuery.trim()) return reflections;
    return reflections.filter((r) =>
      r.reflection_text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredData = getFilteredReflections();

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatTime = (timeStr) => {
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBlock}>
          <Text style={[styles.cardDate, { color: colors.textPrimary }]}>
            {formatDate(item.date)}
          </Text>
          <Text style={[styles.cardTime, { color: colors.textSecondary }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
        <View style={styles.actionsBlock}>
          <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.iconBtn}>
            <Feather name="edit-2" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeletePress(item.id)} style={styles.iconBtn}>
            <Feather name="trash-2" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.cardBody, { color: colors.textPrimary }]}>
        {item.reflection_text}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header Block */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>History</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Feather name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBlock}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search reflections..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* reflections FlatList */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title={searchQuery ? "No search matches" : "No reflections yet"}
            description={
              searchQuery
                ? "Try searching for a different keyword."
                : "Your completed habits history will appear here."
            }
          />
        }
      />

      {/* Edit Entry Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Entry</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Input
              placeholder="Record your achievements..."
              value={editText}
              onChangeText={setEditText}
              multiline
            />

            <Button title="Save Edits" onPress={handleSaveEdit} style={styles.modalBtn} />
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
  searchBlock: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  searchBar: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: RADIUS.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontSize: 15,
    height: "100%",
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
    paddingBottom: SPACING.sm,
  },
  dateBlock: {
    flex: 1,
  },
  cardDate: {
    ...TYPOGRAPHY.sectionTitle,
    fontSize: 16,
    fontWeight: "bold",
  },
  cardTime: {
    ...TYPOGRAPHY.small,
    marginTop: 2,
  },
  actionsBlock: {
    flexDirection: "row",
  },
  iconBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  cardBody: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
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
  modalBtn: {
    marginTop: SPACING.sm,
  },
});

export default HistoryScreen;
