export type FeedItem = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
};

export const FEED: ReadonlyArray<FeedItem> = [
  {
    id: "f1",
    title: "A primer on Yoga layout",
    summary: "Why flex:1 distributes space the way it does, and where minWidth kinks appear.",
    imageUrl: "https://picsum.photos/seed/a/400/240",
  },
  {
    id: "f2",
    title: "Fabric measureLayout in depth",
    summary: "The JSI path and why it replaces UIManager on new-arch RN.",
    imageUrl: "https://picsum.photos/seed/b/400/240",
  },
  {
    id: "f3",
    title: "Reduce-Motion the right way",
    summary: "ReduceMotion.System short-circuits Reanimated animations without JS branching.",
    imageUrl: "https://picsum.photos/seed/c/400/240",
  },
];
