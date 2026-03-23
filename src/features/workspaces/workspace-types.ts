export type WorkspaceNavigationItem = {
  id: string;
  slug: string;
  name: string;
  role: "owner" | "admin" | "member";
  avatarUrl: string | null;
  memberCount: number;
};
