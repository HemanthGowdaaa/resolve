import React from "react";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useTheme } from "../providers/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";

// Import Screens
import HomeScreen from "../screens/HomeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  const { user, logout } = useAuthStore();
  const { colors } = useTheme();

  return (
    <DrawerContentScrollView 
      {...props} 
      contentContainerStyle={[styles.drawerContainer, { backgroundColor: colors.card }]}
    >
      {/* Profile Header Block */}
      <View style={[styles.profileHeader, { borderBottomColor: colors.border }]}>
        <Image
          source={
            user?.profile_picture
              ? { uri: user.profile_picture }
              : require("../assets/default_avatar.png") // Fallback asset
          }
          style={styles.avatar}
        />
        <Text style={[styles.userName, { color: colors.textPrimary }]}>
          {user?.full_name || "Account Owner"}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {user?.email || "user@example.com"}
        </Text>
      </View>

      {/* Screen Navigation Options */}
      <View style={styles.menuItems}>
        <DrawerItemList {...props} />
      </View>

      {/* Footer / Sign Out Button */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.error + "20" }]} // Soft red transparent background
          onPress={() => logout()}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

export const DrawerNavigator = () => {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: "right", // Right-sided drawer entry
        headerShown: false,
        drawerActiveBackgroundColor: colors.primary + "10", // 10% opacity primary
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          ...TYPOGRAPHY.sectionTitle,
          fontSize: 16,
        },
        drawerStyle: {
          width: 280,
          borderTopLeftRadius: RADIUS.bottomSheet,
          borderBottomLeftRadius: RADIUS.bottomSheet,
        },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Calendar" component={CalendarScreen} />
      <Drawer.Screen name="History" component={HistoryScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  profileHeader: {
    padding: SPACING.lg,
    alignItems: "center",
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: SPACING.sm,
  },
  userName: {
    ...TYPOGRAPHY.cardTitle,
    marginBottom: 2,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
  },
  menuItems: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  logoutButton: {
    padding: SPACING.md,
    borderRadius: RADIUS.button,
    alignItems: "center",
  },
  logoutText: {
    ...TYPOGRAPHY.sectionTitle,
    fontSize: 16,
  },
});

export default DrawerNavigator;
