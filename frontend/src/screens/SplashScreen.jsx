import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useTheme } from "../providers/ThemeProvider";
import { SPACING, TYPOGRAPHY } from "../constants/theme";
import { Feather } from "../components/FeatherIcon";

const { height } = Dimensions.get("window");

export const SplashScreen = () => {
  const { colors } = useTheme();
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    opacity.value = withTiming(1, { duration: 1000 });
    scale.value = withTiming(1, { duration: 1200 });
    textOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerBlock}>
        {/* Animated Minimalist Logo Wrapper */}
        <Animated.View style={[styles.logoCircle, { backgroundColor: colors.primary + "15" }, animatedLogoStyle]}>
          <Feather name="compass" size={64} color={colors.primary} />
        </Animated.View>

        {/* Brand Names & Tagline */}
        <Animated.View style={[styles.textBlock, animatedTextStyle]}>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>Resolve</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Consistency creates greatness.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Calm • Minimal • Offline-First
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.xl,
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  textBlock: {
    alignItems: "center",
  },
  appName: {
    ...TYPOGRAPHY.appName,
    marginBottom: SPACING.xs,
  },
  tagline: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    textAlign: "center",
  },
  footer: {
    marginBottom: height * 0.02,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "500",
  },
});

export default SplashScreen;
