import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { StyleSheet } from "react-native-unistyles";
import type { User } from "../mocks/users";
import { IconBadge } from "./IconBadge";

export function UserCard({ user }: { user: User }): React.ReactElement {
  return (
    <View style={styles.card}>
      <Image source={user.avatarUrl} style={styles.avatar} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name}>{user.name}</Text>
          <IconBadge kind="verified" />
        </View>
        <Text style={styles.role}>{user.role}</Text>
        <Text style={styles.bio}>{user.bio}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  body: { flex: 1, gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 17, fontWeight: "600", color: theme.colors.textPrimary },
  role: { fontSize: 13, color: theme.colors.textMuted },
  bio: { fontSize: 15, color: theme.colors.textPrimary, marginTop: 4 },
}));
