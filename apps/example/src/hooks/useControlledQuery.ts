import { useLocalSearchParams } from "expo-router";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { MockConfig } from "../mocks/api";

export function useControlledQuery<T>(
  key: ReadonlyArray<string>,
  fetcher: (config: MockConfig) => Promise<T>,
  defaultConfig: MockConfig = {},
): UseQueryResult<T> {
  const params = useLocalSearchParams();
  const delayMs = params.delay !== undefined ? Number(params.delay) : defaultConfig.delayMs;
  const failAfterMs = params.fail !== undefined ? Number(params.fail) : defaultConfig.failAfterMs;
  return useQuery<T>({
    queryKey: [...key, { delayMs, failAfterMs }],
    queryFn: () =>
      fetcher({
        ...(delayMs !== undefined ? { delayMs } : {}),
        ...(failAfterMs !== undefined ? { failAfterMs } : {}),
      }),
  });
}
