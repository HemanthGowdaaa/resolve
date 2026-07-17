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

export const RegisterScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordVal = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 1. Call Registration Endpoint
      const response = await AuthService.register(
        data.email,
        data.password,
        data.fullName
      );
      
      // 2. Save tokens first so subsequent requests are authenticated
      await setTokens(response.access, response.refresh);
      
      // 3. Fetch User Profile Info
      const profile = await AuthService.getProfile();
      
      // 4. Set the user profile in store
      await setUser(profile);
      
      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      const errorMsg = error.response?.data?.email || error.response?.data?.detail || "Registration failed. Try again.";
      Alert.alert("Registration Failed", String(errorMsg));
    } finally {
      setLoading(false);
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
        {/* Upper Heading */}
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join Resolve and start building better habits daily.
          </Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.formBlock}>
          <Controller
            control={control}
            rules={{ required: "Full name is required" }}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Enter your name"
                autoCapitalize="words"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.fullName?.message}
              />
            )}
          />

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
            rules={{
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
              },
            }}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Choose a password"
                secureTextEntry
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            rules={{
              required: "Confirm password is required",
              validate: (val) => val === passwordVal || "Passwords do not match",
            }}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter password"
                secureTextEntry
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.registerBtn}
          />
        </View>

        {/* Footer Navigation Link */}
        <View style={styles.footerBlock}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Log In</Text>
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
    marginBottom: SPACING.lg,
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
  registerBtn: {
    marginTop: SPACING.md,
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
  loginLink: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default RegisterScreen;
