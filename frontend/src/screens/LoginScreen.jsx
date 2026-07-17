import React, { useState, useEffect } from "react";
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
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useAuthStore } from "../store/useAuthStore";
import { AuthService } from "../services/auth";
import { useTheme } from "../providers/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import Input from "../components/Input";
import Button from "../components/Button";
import { Feather } from "../components/FeatherIcon";

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Construct standard Expo redirect URI (uses proxy on native, direct on web)
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "resolve",
    preferLocalhost: true
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    extraParams: {
      prompt: "select_account",
    },
  });

  // Listen for authentication changes from the Google provider hook
  useEffect(() => {
    if (response) {
      if (response.type === "success") {
        const idToken = response.params?.id_token || response.authentication?.idToken;
        if (idToken) {
          handleGoogleLoginSuccess(idToken);
        } else {
          console.error("[AUTH] Google Sign-In Success but no ID Token found in response:", response);
          Alert.alert("Google Sign-In Failed", "No ID Token returned from Google.");
          setGoogleLoading(false);
        }
      } else if (response.type === "error" || response.type === "cancel") {
        console.warn("[AUTH] Google Sign-In response status:", response.type);
        setGoogleLoading(false);
      }
    }
  }, [response]);

  const handleGoogleLoginSuccess = async (idToken) => {
    setGoogleLoading(true);
    try {
      console.log("[AUTH] Google Sign-In => Exchanging token with backend...");
      const res = await AuthService.googleLogin(idToken);
      
      await setTokens(res.access, res.refresh);
      const profile = await AuthService.getProfile();
      await setUser(profile);
      console.log("[AUTH] Google login completed successfully.");
    } catch (error) {
      console.error("[AUTH] Google Sign-In backend verification failed:", error.message);
      Alert.alert("Google Sign-In Failed", "Verification with backend failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLoginTrigger = () => {
    setGoogleLoading(true);
    promptAsync().catch((err) => {
      console.error("[AUTH] Google Sign-In launch failed:", err.message);
      setGoogleLoading(false);
    });
  };

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
      await setTokens(response.access, response.refresh);

      // 2. Access profile details
      const profile = await AuthService.getProfile();

      // 3. Store user profile in store
      await setUser(profile);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Invalid email or password credentials.";
      Alert.alert("Login Failed", errorMsg);
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
            onPress={handleGoogleLoginTrigger}
            disabled={googleLoading || !request}
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
