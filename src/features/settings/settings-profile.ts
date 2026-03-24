export type SettingsProfileSnapshot = {
  id: string;
  email: string;
  name: string | null;
  verified: boolean;
  avatarUrl: string | null;
};

export type SettingsProfilePayload = {
  profile: SettingsProfileSnapshot;
};
