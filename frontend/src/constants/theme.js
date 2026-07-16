export const COLORS = {
  primary: "#4F46E5",
  secondary: "#818CF8",
  accent: "#22C55E",
  success: "#86EFAC",
  error: "#FCA5A5",
  warning: "#FCD34D",
  
  light: {
    background: "#F8FAFC",
    card: "#FFFFFF",
    textPrimary: "#111827",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    shadow: "rgba(15, 23, 42, 0.05)",
  },
  dark: {
    background: "#0F172A",
    card: "#1E293B",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    border: "#334155",
    shadow: "rgba(0, 0, 0, 0.3)",
  }
};

export const TYPOGRAPHY = {
  fontFamily: "System", // System font (Inter-like rendering)
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 38,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 34,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "normal",
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: "normal",
    lineHeight: 18,
  },
  small: {
    fontSize: 12,
    fontWeight: "normal",
    lineHeight: 16,
  }
};

export const RADIUS = {
  card: 20,
  button: 16,
  input: 14,
  bottomSheet: 24,
  calendarCell: 12,
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  dark: {
    shadowColor: COLORS.dark.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
