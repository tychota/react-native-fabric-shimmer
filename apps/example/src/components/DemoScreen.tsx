import React from "react";
import { ScrollView, View, Text } from "react-native";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function DemoScreen({ title, subtitle, children }: Props): React.ReactElement {
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {subtitle !== undefined ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 16, gap: 16 },
  subtitle: { color: theme.colors.textMuted, fontSize: 13 },
  inner: { gap: 16 },
}));
