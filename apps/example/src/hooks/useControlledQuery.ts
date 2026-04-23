import { useLocalSearchParams } from "expo-router";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { MockConfig } from "../mocks/api";

export function useControlledQuery<T>(
  key: ReadonlyArray<string>,
  fetcher: (config: MockConfig) => Promise<T>,
  defaultConfig: MockConfig = {},
): UseQueryResult<T> {
  const params = useLocalSearchParams();
  const delayRaw = params["delay"];
  const failRaw = params["fail"];
  const delayMs = typeof delayRaw === "string" ? Number(delayRaw) : defaultConfig.delayMs;
  const failAfterMs = typeof failRaw === "string" ? Number(failRaw) : defaultConfig.failAfterMs;
  return useQuery<T>({
    queryKey: [...key, { delayMs, failAfterMs }],
    queryFn: () =>
      fetcher({
        ...(delayMs !== undefined ? { delayMs } : {}),
        ...(failAfterMs !== undefined ? { failAfterMs } : {}),
      }),
  });
}
