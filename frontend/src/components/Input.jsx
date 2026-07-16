import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { Feather } from "./FeatherIcon";

export const Input = ({
  label,
  error,
  secureTextEntry = false,
  style = {},
  inputStyle = {},
  multiline = false,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            borderColor: error
              ? colors.error
              : isFocused
              ? colors.primary
              : colors.border,
          },
          multiline && styles.multilineContainer,
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            { color: colors.textPrimary },
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
    width: "100%",
  },
  label: {
    ...TYPOGRAPHY.small,
    marginBottom: SPACING.xs,
    fontWeight: "500",
  },
  inputContainer: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: RADIUS.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  multilineContainer: {
    height: 120,
    alignItems: "flex-start",
    paddingVertical: SPACING.sm,
  },
  textInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    height: "100%",
    padding: 0,
    margin: 0,
  },
  multilineInput: {
    textAlignVertical: "top",
    height: "100%",
  },
  iconButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    marginTop: SPACING.xs,
  },
});

export default Input;
