import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { SPACING, TYPOGRAPHY } from "../constants/theme";
import { Feather } from "./FeatherIcon";
import Button from "./Button";

export const EmptyState = ({
  icon = "clipboard",
  title = "No entries yet",
  description = "Start your journey of self-improvement today.",
  actionTitle,
  onActionPress,
  style = {}
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrapper, { backgroundColor: colors.border + "30" }]}>
        <Feather name={icon} size={36} color={colors.textSecondary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      
      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    width: "100%",
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.cardTitle,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  description: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    textAlign: "center",
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  button: {
    maxWidth: 200,
  },
});

export default EmptyState;
