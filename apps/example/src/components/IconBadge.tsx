import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = { kind: "verified" | "admin" | "new" };

function IconBadgeInner(_: Props): React.ReactElement {
  return (
    <View style={styles.wrap}>
      <View style={styles.dot} />
      <View style={styles.ring} />
    </View>
  );
}

export const IconBadge = Object.assign(IconBadgeInner, { displayName: "IconBadge" });

const styles = StyleSheet.create((theme) => ({
  wrap: { width: 14, height: 14, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.accent },
  ring: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
}));
