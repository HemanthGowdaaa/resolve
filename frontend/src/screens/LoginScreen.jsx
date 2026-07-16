import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useAuthStore } from "../store/useAuthStore";
import { AuthService } from "../services/auth";
import { useTheme } from "../providers/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import Input from "../components/Input";
import Button from "../components/Button";
import { Feather } from "../components/FeatherIcon";

export const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await AuthService.login(data.email, data.password);
      
      // 1. Store tokens first so subsequent requests are authenticated
      setTokens(response.access, response.refresh);
      
      // 2. Access profile details
      const profile = await AuthService.getProfile();
      
      // 3. Store user profile in store
      setUser(profile);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Invalid email or password credentials.";
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Exchange mock token for development convenience
      const response = await AuthService.googleLogin("mock_token_12345");
      
      // 1. Store tokens first
      setTokens(response.access, response.refresh);
      
      // 2. Fetch profile
      const profile = await AuthService.getProfile();
      
      // 3. Set profile in store
      setUser(profile);
    } catch (error) {
      Alert.alert("Google Sign-In Failed", "Could not complete Google authentication.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Upper Heading Info */}
        <View style={styles.headerBlock}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="compass" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Log in to continue resolving your goals.
          </Text>
        </View>

        {/* Auth Input Fields Box */}
        <View style={styles.formBlock}>
          <Controller
            control={control}
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            }}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            rules={{ required: "Password is required" }}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Button
            title="Log In"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.loginBtn}
          />

          <View style={styles.dividerBlock}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
          >
            <Feather name="chrome" size={20} color={colors.textPrimary} style={styles.googleIcon} />
            <Text style={[styles.googleText, { color: colors.textPrimary }]}>
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Navigation Link */}
        <View style={styles.footerBlock}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: SPACING.xl,
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.screenTitle,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    textAlign: "center",
  },
  formBlock: {
    width: "100%",
  },
  loginBtn: {
    marginTop: SPACING.md,
  },
  dividerBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.lg,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    marginHorizontal: SPACING.md,
    fontWeight: "500",
  },
  googleButton: {
    flexDirection: "row",
    height: 52,
    borderWidth: 1.5,
    borderRadius: RADIUS.button,
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    marginRight: SPACING.sm,
  },
  googleText: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  footerBlock: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
  },
  registerLink: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default LoginScreen;
