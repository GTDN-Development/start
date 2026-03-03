export type AccountProfileSnapshot = {
  email: string;
  name: string | null;
  verified: boolean;
  avatarUrl: string | null;
};

export type AccountProfilePayload = {
  profile: AccountProfileSnapshot;
};
