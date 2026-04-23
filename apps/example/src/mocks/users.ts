export type User = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
};

export const USERS: ReadonlyArray<User> = [
  {
    id: "1",
    name: "Alice Martin",
    role: "Product designer",
    bio: "Designs interfaces and the systems behind them. Loves typography.",
    avatarUrl: "https://i.pravatar.cc/112?img=1",
  },
  {
    id: "2",
    name: "Jean Dupont",
    role: "Staff engineer",
    bio: "Works on the mobile architecture team. Maintains a monorepo and tolerates Android builds.",
    avatarUrl: "https://i.pravatar.cc/112?img=2",
  },
  {
    id: "3",
    name: "Priya Narasimhan",
    role: "Engineering manager",
    bio: "Lead for the payments team. Focused on shipping small and iterating.",
    avatarUrl: "https://i.pravatar.cc/112?img=3",
  },
  {
    id: "4",
    name: "Marcus Lee",
    role: "Backend engineer",
    bio: "Builds reliable APIs and argues about cache eviction for fun.",
    avatarUrl: "https://i.pravatar.cc/112?img=4",
  },
];

export const MOCK_USER: User = USERS[0]!;

export const USER_LONG_BIO: User = {
  ...MOCK_USER,
  bio: Array(15)
    .fill(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
    )
    .join(" "),
};
