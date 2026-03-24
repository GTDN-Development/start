"use client";

import { SettingsPage } from "@/features/application/settings-page";
import { SettingsPageSkeleton } from "@/features/application/settings-page-skeleton";

export default function Loading() {
  return (
    <SettingsPage>
      <SettingsPageSkeleton itemCount={4} />
    </SettingsPage>
  );
}
