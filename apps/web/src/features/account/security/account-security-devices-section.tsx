import { YourDevicesSettingsItem } from "@/features/account/security/your-devices-settings-item";
import { requireCurrentUser } from "@/server/auth/current-user";
import { listDeviceSessions } from "@/server/device-sessions/device-sessions-service";

export async function AccountSecurityDevicesSection() {
  const currentUser = await requireCurrentUser();

  const initialSessions = currentUser.ok
    ? await listDeviceSessions({
        pb: currentUser.pb,
        userId: currentUser.user.id,
        currentSessionIdHash: currentUser.currentSessionIdHash,
      })
    : [];

  return <YourDevicesSettingsItem initialSessions={initialSessions} />;
}
