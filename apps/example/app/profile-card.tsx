import React from "react";
import { Skeleton } from "react-native-dynamic-shimmer";
import { UnistylesRuntime } from "react-native-unistyles";
import { DemoScreen } from "../src/components/DemoScreen";
import { UserCard } from "../src/components/UserCard";
import { MOCK_USER } from "../src/mocks/users";
import { fetchUser } from "../src/mocks/api";
import { useControlledQuery } from "../src/hooks/useControlledQuery";

export default function ProfileCard(): React.ReactElement {
  const { data } = useControlledQuery(["user", "1"], (cfg) => fetchUser("1", cfg), {
    delayMs: 1500,
  });
  const theme = UnistylesRuntime.getTheme();
  return (
    <DemoScreen
      title="Profile card"
      subtitle="1500 ms delay. Pass ?delay=3000 or ?fail=800 to override."
    >
      <Skeleton
        loading={data === undefined}
        baseColor={theme.colors.skeletonBase}
        highlightColor={theme.colors.skeletonHighlight}
      >
        <UserCard user={data ?? MOCK_USER} />
      </Skeleton>
    </DemoScreen>
  );
}
