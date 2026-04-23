export const tokens = {
  colors: {
    light: {
      bg: "#ffffff",
      surface: "#f7f7f8",
      textPrimary: "#0b0b0f",
      textMuted: "#6a6b72",
      skeletonBase: "#e4e4e7",
      skeletonHighlight: "#f4f4f5",
      border: "#e0e0e4",
      accent: "#2b6cff",
      error: "#d82e2e",
    },
    dark: {
      bg: "#0b0b0f",
      surface: "#14141a",
      textPrimary: "#f5f5f7",
      textMuted: "#a6a7ae",
      skeletonBase: "#1f1f23",
      skeletonHighlight: "#2a2a2f",
      border: "#242428",
      accent: "#6e99ff",
      error: "#ff6b6b",
    },
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const,
  radius: { sm: 6, md: 12, round: 999 } as const,
  font: { sm: 13, base: 15, lg: 17, xl: 20 } as const,
} as const;

export type ColorTheme = typeof tokens.colors.light;
