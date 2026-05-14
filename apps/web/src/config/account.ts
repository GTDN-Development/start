export const accountConfig = {
  limits: {
    profileNameMaxLength: 32,
    avatarMaxSizeBytes: 1024 * 1024,
  },
  avatar: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as readonly string[],
  },
} as const;
