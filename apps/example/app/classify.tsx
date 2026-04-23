import React from "react";
import { View, Text, Switch } from "react-native";
import { Skeleton, defaultClassify, type ClassifyFn } from "react-native-dynamic-shimmer";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { DemoScreen } from "../src/components/DemoScreen";
import { UserCard } from "../src/components/UserCard";
import { MOCK_USER } from "../src/mocks/users";
import { fetchUser } from "../src/mocks/api";
import { useControlledQuery } from "../src/hooks/useControlledQuery";

const classifyIconBadgeAsLeaf: ClassifyFn = (fiber) => {
  const t = fiber.type;
  if (typeof t === "function" && (t as { displayName?: string }).displayName === "IconBadge")
    return "leaf";
  return defaultClassify(fiber);
};

export default function Classify(): React.ReactElement {
  const theme = UnistylesRuntime.getTheme();
  const [enabled, setEnabled] = React.useState(true);
  const { data } = useControlledQuery(["user", "classify"], (cfg) => fetchUser("1", cfg), {
    delayMs: 1500,
  });

  return (
    <DemoScreen
      title="Classify: custom"
      subtitle="Treat IconBadge as a single leaf instead of descending."
    >
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Custom classify</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>
      <Skeleton
        loading={data === undefined}
        baseColor={theme.colors.skeletonBase}
        highlightColor={theme.colors.skeletonHighlight}
        {...(enabled ? { classify: classifyIconBadgeAsLeaf } : {})}
      >
        <UserCard user={data ?? MOCK_USER} />
      </Skeleton>
    </DemoScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  toggleLabel: { color: theme.colors.textPrimary, fontSize: 15 },
}));
