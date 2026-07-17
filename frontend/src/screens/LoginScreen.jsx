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
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const clientId = "mock-google-client-id.apps.googleusercontent.com";
      const redirectUri = Platform.OS === "web" 
        ? window.location.origin 
        : Linking.createURL("oauth");

      const nonce = Math.random().toString(36).substring(2, 15);
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=openid%20profile%20email` +
        `&nonce=${nonce}` +
        `&prompt=select_account`;

      console.log("[AUTH] Google Sign-In => Initiating auth session:", authUrl);

      let authResult;
      if (Platform.OS === "web") {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          authUrl,
          "Google Sign In",
          `width=${width},height=${height},top=${top},left=${left}`
        );

        authResult = await new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            try {
              if (!popup || popup.closed) {
                clearInterval(interval);
                reject(new Error("Google Sign-In popup closed by user."));
                return;
              }
              const currentUrl = popup.location.href;
              if (currentUrl.includes("access_token=") || currentUrl.includes("id_token=")) {
                clearInterval(interval);
                popup.close();
                resolve(currentUrl);
              }
            } catch (e) {
              // Ignore cross-origin errors during transitions
            }
          }, 500);
        });
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
        if (result.type === "success") {
          authResult = result.url;
        } else {
          throw new Error("Google Sign-In cancelled.");
        }
      }

      if (authResult) {
        const hash = authResult.split("#")[1] || authResult.split("?")[1] || "";
        const urlParams = new URLSearchParams(hash);
        const idToken = urlParams.get("id_token") || urlParams.get("access_token");

        if (!idToken) {
          throw new Error("Failed to extract ID token from Google authorization response.");
        }

        console.log("[AUTH] Google Sign-In Token Retrieved, submitting to backend...");
        const response = await AuthService.googleLogin(idToken);
        
        await setTokens(response.access, response.refresh);
        const profile = await AuthService.getProfile();
        await setUser(profile);
        console.log("[AUTH] Google login completed successfully.");
      }
    } catch (error) {
      console.error("[AUTH] Google Sign-In Failed:", error.message);
      Alert.alert("Google Sign-In Failed", error.message || "Could not complete Google authentication.");
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
