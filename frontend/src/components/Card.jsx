import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { RADIUS, SPACING } from "../constants/theme";

export const Card = ({
  children,
  onPress,
  style = {},
  ...props
}) => {
  const { colors, shadows } = useTheme();

  const containerStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      shadowColor: shadows.shadowColor,
      shadowOffset: shadows.shadowOffset,
      shadowOpacity: shadows.shadowOpacity,
      shadowRadius: shadows.shadowRadius,
      elevation: shadows.elevation,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.9}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.card,
    borderWidth: 1,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    width: "100%",
  },
});

export default Card;
