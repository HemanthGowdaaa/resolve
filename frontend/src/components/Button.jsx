import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";

export const Button = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style = {},
  textStyle = {},
  ...props
}) => {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case "secondary":
        return { backgroundColor: colors.secondary };
      case "outlined":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case "primary":
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case "outlined":
        return colors.primary;
      case "secondary":
        return "#FFFFFF";
      case "primary":
      default:
        return "#FFFFFF";
    }
  };

  const isButtonDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isButtonDisabled}
      style={[
        styles.button,
        getButtonStyle(),
        isButtonDisabled && { backgroundColor: colors.border },
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: RADIUS.button,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    width: "100%",
  },
  text: {
    ...TYPOGRAPHY.sectionTitle,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Button;
