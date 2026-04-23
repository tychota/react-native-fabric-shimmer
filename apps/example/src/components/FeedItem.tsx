import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { StyleSheet } from "react-native-unistyles";
import type { FeedItem as FeedItemT } from "../mocks/feed";

export function FeedItem({ item }: { item: FeedItemT }): React.ReactElement {
  return (
    <View style={styles.card}>
      <Image source={item.imageUrl} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.summary}>{item.summary}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  image: { width: "100%", height: 160 },
  body: { padding: 16, gap: 4 },
  title: { fontSize: 17, fontWeight: "600", color: theme.colors.textPrimary },
  summary: { fontSize: 15, color: theme.colors.textMuted },
}));
