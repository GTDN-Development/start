export type AccountProfileSnapshot = {
  email: string;
  name: string | null;
  verified: boolean;
  avatarUrl: string | null;
};

export function createStaticAccountProfileSnapshot(): AccountProfileSnapshot {
  return {
    email: "demo@example.com",
    name: "Demo User",
    verified: false,
    avatarUrl: null,
  };
}
