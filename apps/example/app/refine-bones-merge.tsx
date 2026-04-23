import React from "react";
import { View, Text, Switch } from "react-native";
import { Skeleton, findAll, merge } from "react-native-dynamic-shimmer";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { DemoScreen } from "../src/components/DemoScreen";
import { UserCard } from "../src/components/UserCard";
import { MOCK_USER } from "../src/mocks/users";
import { fetchUser } from "../src/mocks/api";
import { useControlledQuery } from "../src/hooks/useControlledQuery";

export default function RefineBonesMerge(): React.ReactElement {
  const theme = UnistylesRuntime.getTheme();
  const [enabled, setEnabled] = React.useState(true);
  const { data } = useControlledQuery(["user", "merge"], (cfg) => fetchUser("1", cfg), {
    delayMs: 1500,
  });

  return (
    <DemoScreen title="Refine: merge" subtitle="Merge the name and role text bones into one.">
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Merge enabled</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>
      <Skeleton
        loading={data === undefined}
        baseColor={theme.colors.skeletonBase}
        highlightColor={theme.colors.skeletonHighlight}
        {...(enabled
          ? {
              refineBones: (tree) => {
                const texts = findAll(tree, (n) => n.type === "RCTText" && n.rect.y < 50);
                return texts.length >= 2 ? merge(tree, texts.slice(0, 2)) : tree;
              },
            }
          : {})}
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
