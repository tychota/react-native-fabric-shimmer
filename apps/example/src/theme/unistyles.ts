import { StyleSheet } from "react-native-unistyles";
import { tokens } from "./tokens";

const breakpoints = { xs: 0, sm: 360, md: 640, lg: 1024 } as const;

type AppBreakpoints = typeof breakpoints;
type AppThemes = {
  light: { colors: typeof tokens.colors.light };
  dark: { colors: typeof tokens.colors.dark };
};

declare module "react-native-unistyles" {
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: {
    light: { colors: tokens.colors.light },
    dark: { colors: tokens.colors.dark },
  },
  breakpoints,
  settings: {
    initialTheme: "light",
  },
});
