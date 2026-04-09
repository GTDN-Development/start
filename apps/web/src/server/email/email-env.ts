const SMTP_MAIL_TRANSPORT = "smtp";
const MAILPIT_API_MAIL_TRANSPORT = "mailpit-api";

type EmailEnv = Record<string, string | undefined>;

type MailSender = {
  name: string;
  address: string;
};

export type SmtpMailTransportConfig = {
  mode: typeof SMTP_MAIL_TRANSPORT;
  sender: MailSender;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
};

export type MailpitApiMailTransportConfig = {
  mode: typeof MAILPIT_API_MAIL_TRANSPORT;
  sender: MailSender;
  baseUrl: string;
  authorizationHeader: string;
};

export type MailTransportConfig = SmtpMailTransportConfig | MailpitApiMailTransportConfig;

export function getFormEmailRecipient(env: EmailEnv = process.env): string {
  const recipient = getOptionalTrimmedEnvValue("GENERAL_FORMS_RECIPIENT", env);

  if (!recipient) {
    throw new Error("GENERAL_FORMS_RECIPIENT is required for form emails.");
  }

  return recipient;
}

export function getMailTransportConfig(env: EmailEnv = process.env): MailTransportConfig {
  const mode = getMailTransportMode(env);
  const sender = getMailSender(env);

  if (mode === MAILPIT_API_MAIL_TRANSPORT) {
    return getMailpitApiTransportConfig(sender, env);
  }

  return getSmtpMailTransportConfig(sender, env);
}

export function formatMailSender(sender: MailSender): string {
  return `${sender.name} <${sender.address}>`;
}

function getMailTransportMode(
  env: EmailEnv
): typeof SMTP_MAIL_TRANSPORT | typeof MAILPIT_API_MAIL_TRANSPORT {
  const value = getOptionalTrimmedEnvValue("MAIL_TRANSPORT", env)?.toLowerCase();

  if (!value || value === SMTP_MAIL_TRANSPORT) {
    return SMTP_MAIL_TRANSPORT;
  }

  if (value === MAILPIT_API_MAIL_TRANSPORT) {
    return MAILPIT_API_MAIL_TRANSPORT;
  }

  throw new Error('MAIL_TRANSPORT must be "smtp" or "mailpit-api".');
}

function getMailSender(env: EmailEnv): MailSender {
  return {
    name: getRequiredTrimmedEnvValue("MAIL_FROM_NAME", env),
    address: getRequiredTrimmedEnvValue("MAIL_FROM_ADDRESS", env),
  };
}

function getSmtpMailTransportConfig(sender: MailSender, env: EmailEnv): SmtpMailTransportConfig {
  const port = getRequiredPort(env);

  return {
    mode: SMTP_MAIL_TRANSPORT,
    sender,
    host: getRequiredTrimmedEnvValue("MAIL_HOST", env),
    port,
    secure: getMailTransportSecureValue(port, env),
    auth: {
      user: getRequiredTrimmedEnvValue("MAIL_USERNAME", env),
      pass: getRequiredTrimmedEnvValue("MAIL_PASSWORD", env),
    },
  };
}

function getMailpitApiTransportConfig(
  sender: MailSender,
  env: EmailEnv
): MailpitApiMailTransportConfig {
  const baseUrl = getOptionalTrimmedEnvValue("MAILPIT_BASE_URL", env);

  if (!baseUrl) {
    throw new Error("MAILPIT_BASE_URL is required when MAIL_TRANSPORT=mailpit-api.");
  }

  const username = getOptionalTrimmedEnvValue("MAILPIT_SEND_API_USERNAME", env);
  const password = getOptionalTrimmedEnvValue("MAILPIT_SEND_API_PASSWORD", env);

  if (!username || !password) {
    throw new Error(
      "MAILPIT_SEND_API_USERNAME and MAILPIT_SEND_API_PASSWORD are required for mailpit-api transport."
    );
  }

  return {
    mode: MAILPIT_API_MAIL_TRANSPORT,
    sender,
    baseUrl: normalizeBaseUrl(baseUrl),
    authorizationHeader: createBasicAuthorizationHeader(username, password),
  };
}

function getRequiredPort(env: EmailEnv): number {
  const portValue = getRequiredTrimmedEnvValue("MAIL_PORT", env);
  const port = Number.parseInt(portValue, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("MAIL_PORT must be a valid port number.");
  }

  return port;
}

function getMailTransportSecureValue(port: number, env: EmailEnv): boolean {
  const secureValue = getOptionalTrimmedEnvValue("EMAIL_SECURE", env)?.toLowerCase();

  if (!secureValue) {
    return port === 465;
  }

  if (secureValue === "true") {
    return true;
  }

  if (secureValue === "false") {
    return false;
  }

  throw new Error('EMAIL_SECURE must be "true" or "false" when provided.');
}

function getRequiredTrimmedEnvValue(name: string, env: EmailEnv): string {
  const value = getOptionalTrimmedEnvValue(name, env);

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

function getOptionalTrimmedEnvValue(name: string, env: EmailEnv): string | undefined {
  const value = env[name]?.trim();

  return value ? value : undefined;
}

function normalizeBaseUrl(value: string): string {
  return new URL(value).toString().replace(/\/+$/g, "");
}

function createBasicAuthorizationHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`, "utf8").toString("base64");

  return `Basic ${credentials}`;
}
