type WorkspaceKind = "organization" | "personal";

const WORKSPACE_SETTINGS_PREVIEW = {
  name: "Acme Studio",
  slug: "acme-studio",
  kind: "organization" as WorkspaceKind,
};

export { WORKSPACE_SETTINGS_PREVIEW, type WorkspaceKind };
