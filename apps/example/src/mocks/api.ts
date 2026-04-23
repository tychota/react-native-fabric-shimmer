import { USERS, USER_LONG_BIO, type User } from "./users";
import { FEED, type FeedItem } from "./feed";

export type MockConfig = {
  delayMs?: number;
  failAfterMs?: number;
};

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

function failAfter(ms: number): Promise<never> {
  return new Promise((_, rej) => setTimeout(() => rej(new Error("mock: request failed")), ms));
}

export async function fetchUser(id: string, config: MockConfig = {}): Promise<User> {
  const user = USERS.find((u) => u.id === id) ?? USERS[0]!;
  if (config.failAfterMs !== undefined) return failAfter(config.failAfterMs);
  return delay(user, config.delayMs ?? 1500);
}

export async function fetchLongUser(config: MockConfig = {}): Promise<User> {
  if (config.failAfterMs !== undefined) return failAfter(config.failAfterMs);
  return delay(USER_LONG_BIO, config.delayMs ?? 1500);
}

export async function fetchUserList(config: MockConfig = {}): Promise<ReadonlyArray<User>> {
  if (config.failAfterMs !== undefined) return failAfter(config.failAfterMs);
  return delay(USERS, config.delayMs ?? 1500);
}

export async function fetchFeed(config: MockConfig = {}): Promise<ReadonlyArray<FeedItem>> {
  if (config.failAfterMs !== undefined) return failAfter(config.failAfterMs);
  return delay(FEED, config.delayMs ?? 1500);
}
