import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { COLORS, SHADOWS } from "../constants/theme";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    setIsDark(systemScheme === "dark");
  }, [systemScheme]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const themeColors = isDark ? COLORS.dark : COLORS.light;
  const themeShadows = isDark ? SHADOWS.dark : SHADOWS.light;

  const value = {
    isDark,
    toggleTheme,
    colors: {
      primary: COLORS.primary,
      secondary: COLORS.secondary,
      accent: COLORS.accent,
      success: COLORS.success,
      error: COLORS.error,
      warning: COLORS.warning,
      ...themeColors
    },
    shadows: themeShadows,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
export default ThemeProvider;
