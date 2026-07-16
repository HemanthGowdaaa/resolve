import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../providers/ThemeProvider";
import { RADIUS, SPACING } from "../constants/theme";

export const PageLoader = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.pageContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

export const SkeletonLoader = ({ height = 80, width = "100%", style = {} }) => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Pulse animation: cycles opacity between 0.3 and 0.7 indefinitely
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1, // Loop infinitely
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          width,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  skeleton: {
    borderRadius: RADIUS.card,
    marginVertical: SPACING.xs,
  },
});
