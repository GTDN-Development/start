export type WorkspaceNavigationItem = {
  id: string;
  slug: string;
  name: string;
  kind: "personal" | "organization";
  role: "owner" | "admin" | "member";
  avatarUrl: string | null;
  memberCount: number;
};
