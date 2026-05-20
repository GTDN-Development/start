type GotenbergBasicAuthConfig = {
  username: string;
  password: string;
};

type GotenbergConfig = {
  baseUrl: string;
  basicAuth: GotenbergBasicAuthConfig | null;
};

type GotenbergEnv = Record<string, string | undefined>;

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

export async function renderHtmlToPdf(html: string): Promise<ArrayBuffer> {
  const config = resolveGotenbergConfig();
  const formData = new FormData();

  formData.append("files", new Blob([html], { type: "text/html" }), "index.html");
  formData.append("printBackground", "true");
  formData.append("preferCssPageSize", "true");

  const response = await fetch(`${config.baseUrl}/forms/chromium/convert/html`, {
    method: "POST",
    headers: createGotenbergHeaders(config),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Gotenberg HTML to PDF request failed with status ${response.status}.`);
  }

  return response.arrayBuffer();
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
