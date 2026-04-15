import PocketBase from "pocketbase";
import { pathToFileURL } from "node:url";

export const MAILPIT_SMTP_HOST = "mailpit";
export const MAILPIT_SMTP_PORT = 1025;

export async function applyMailpitSettings(env = process.env) {
  const config = resolveMailpitApplyConfig(env);

  const pb = new PocketBase(config.pbUrl);

  await pb
    .collection("_superusers")
    .authWithPassword(config.pbSuperuserEmail, config.pbSuperuserPassword);

  const currentSettings = await pb.settings.getAll();
  const updatedSettings = createMailpitSettingsPatch(currentSettings, config);

  await pb.settings.update(updatedSettings);

  return {
    pbUrl: config.pbUrl,
    meta: updatedSettings.meta,
    smtp: updatedSettings.smtp,
  };
}

export function resolveMailpitApplyConfig(env = process.env) {
  const pbUrl = env.NEXT_PUBLIC_PB_URL?.trim() || "";
  const pbSuperuserEmail = env.PB_SUPERUSER_EMAIL?.trim() || "";
  const pbSuperuserPassword = env.PB_SUPERUSER_PASSWORD?.trim() || "";
  const pbAppUrl = env.NEXT_PUBLIC_APP_URL?.trim() || "";
  const senderName = env.MAIL_FROM_NAME?.trim() || "";
  const senderAddress = env.MAIL_FROM_ADDRESS?.trim() || "";

  if (!pbUrl) {
    throw new Error("NEXT_PUBLIC_PB_URL is required.");
  }

  if (!pbSuperuserEmail || !pbSuperuserPassword) {
    throw new Error("PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD are required.");
  }

  if (!pbAppUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is required.");
  }

  if (!senderName || !senderAddress) {
    throw new Error("MAIL_FROM_NAME and MAIL_FROM_ADDRESS are required.");
  }

  return {
    pbUrl,
    pbSuperuserEmail,
    pbSuperuserPassword,
    pbAppUrl,
    senderName,
    senderAddress,
  };
}

export function createMailpitSettingsPatch(currentSettings, config) {
  const currentMeta = isPlainObject(currentSettings.meta) ? currentSettings.meta : {};
  const currentSmtp = isPlainObject(currentSettings.smtp) ? currentSettings.smtp : {};

  return {
    meta: {
      ...currentMeta,
      appURL: config.pbAppUrl,
      senderName: config.senderName,
      senderAddress: config.senderAddress,
    },
    smtp: {
      ...currentSmtp,
      enabled: true,
      host: MAILPIT_SMTP_HOST,
      port: MAILPIT_SMTP_PORT,
      authMethod: "",
      tls: false,
      username: "",
      password: "",
      localName:
        typeof currentSmtp.localName === "string" && currentSmtp.localName.trim()
          ? currentSmtp.localName.trim()
          : "",
    },
  };
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function main() {
  const result = await applyMailpitSettings();

  console.log(`Applied Mailpit settings to ${result.pbUrl}`);
  console.log(
    JSON.stringify(
      {
        meta: result.meta,
        smtp: {
          ...result.smtp,
          password: "",
        },
      },
      null,
      2
    )
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch(function handleError(error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
