type GotenbergBasicAuthConfig = {
  username: string;
  password: string;
};

type GotenbergConfig = {
  baseUrl: string;
  basicAuth: GotenbergBasicAuthConfig | null;
};

type GotenbergEnv = Record<string, string | undefined>;

type RenderHtmlToPdfPageOptions = {
  printBackground?: boolean;
  preferCssPageSize?: boolean;
};

export type RenderHtmlToPdfInput = {
  html: string;
  page?: RenderHtmlToPdfPageOptions;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 30_000;

export function resolveGotenbergConfig(env: GotenbergEnv = process.env): GotenbergConfig {
  const baseUrl = env.GOTENBERG_BASE_URL?.trim() ?? "";

  if (!baseUrl) {
    throw new Error("GOTENBERG_BASE_URL is required.");
  }

  const username = env.GOTENBERG_API_BASIC_AUTH_USERNAME?.trim() ?? "";
  const password = env.GOTENBERG_API_BASIC_AUTH_PASSWORD?.trim() ?? "";

  if ((username && !password) || (!username && password)) {
    throw new Error(
      "GOTENBERG_API_BASIC_AUTH_USERNAME and GOTENBERG_API_BASIC_AUTH_PASSWORD must be configured together."
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/g, ""),
    basicAuth: username && password ? { username, password } : null,
  };
}

export async function renderHtmlToPdf(input: RenderHtmlToPdfInput): Promise<ArrayBuffer> {
  const config = resolveGotenbergConfig();
  const formData = new FormData();
  const controller = new AbortController();
  const timeout = setTimeout(function abortGotenbergRequest() {
    controller.abort();
  }, resolveTimeoutMs(input.timeoutMs));

  formData.append("files", new Blob([input.html], { type: "text/html" }), "index.html");
  appendPdfPageOptions(formData, input.page);

  try {
    const response = await fetch(`${config.baseUrl}/forms/chromium/convert/html`, {
      method: "POST",
      headers: createGotenbergHeaders(config),
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Gotenberg HTML to PDF request failed with status ${response.status}.`);
    }

    return response.arrayBuffer();
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Gotenberg HTML to PDF request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function createGotenbergHeaders(config: GotenbergConfig): Headers {
  const headers = new Headers();

  if (config.basicAuth) {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(
        `${config.basicAuth.username}:${config.basicAuth.password}`,
        "utf8"
      ).toString("base64")}`
    );
  }

  return headers;
}

function appendPdfPageOptions(formData: FormData, page: RenderHtmlToPdfPageOptions = {}) {
  formData.append("printBackground", String(page.printBackground ?? true));
  formData.append("preferCssPageSize", String(page.preferCssPageSize ?? true));
}

function resolveTimeoutMs(timeoutMs: number | undefined): number {
  if (!timeoutMs) {
    return DEFAULT_TIMEOUT_MS;
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new Error("Gotenberg timeout must be a positive number.");
  }

  return timeoutMs;
}
