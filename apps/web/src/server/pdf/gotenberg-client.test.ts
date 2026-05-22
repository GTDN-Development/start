import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHtmlToPdf, resolveGotenbergConfig } from "./gotenberg-client";

describe("Gotenberg client", function describeGotenbergClient() {
  afterEach(function resetEnvironment() {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("normalizes the base URL and allows unauthenticated local usage", function testConfigWithoutAuth() {
    const config = resolveGotenbergConfig({
      GOTENBERG_BASE_URL: " https://gotenberg.example.com/ ",
    });

    expect(config).toEqual({
      baseUrl: "https://gotenberg.example.com",
      basicAuth: null,
    });
  });

  it("requires the base URL", function testMissingBaseUrl() {
    expect(function resolveMissingConfig() {
      resolveGotenbergConfig({});
    }).toThrow("GOTENBERG_BASE_URL is required.");
  });

  it("requires complete basic auth credentials", function testIncompleteAuth() {
    expect(function resolveIncompleteConfig() {
      resolveGotenbergConfig({
        GOTENBERG_BASE_URL: "https://gotenberg.example.com",
        GOTENBERG_API_BASIC_AUTH_USERNAME: "gotenberg",
      });
    }).toThrow(
      "GOTENBERG_API_BASIC_AUTH_USERNAME and GOTENBERG_API_BASIC_AUTH_PASSWORD must be configured together."
    );
  });

  it("sends HTML as multipart form data with basic PDF options and auth", async function testRenderRequest() {
    vi.stubEnv("GOTENBERG_BASE_URL", "https://gotenberg.example.com/");
    vi.stubEnv("GOTENBERG_API_BASIC_AUTH_USERNAME", "user");
    vi.stubEnv("GOTENBERG_API_BASIC_AUTH_PASSWORD", "pass");

    const fetchMock = vi.fn<(_input: RequestInfo | URL, _init?: RequestInit) => Promise<Response>>(
      async function mockFetch() {
        return new Response(new Uint8Array([37, 80, 68, 70]), {
          status: 200,
        });
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const pdf = await renderHtmlToPdf({
      html: "<h1>Hello</h1>",
    });

    expect(new Uint8Array(pdf)).toEqual(new Uint8Array([37, 80, 68, 70]));
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe("https://gotenberg.example.com/forms/chromium/convert/html");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toBeInstanceOf(Headers);
    expect((init?.headers as Headers).get("authorization")).toBe("Basic dXNlcjpwYXNz");
    expect(init?.body).toBeInstanceOf(FormData);

    const formData = init?.body as FormData;
    const file = formData.get("files");

    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("index.html");
    expect(await (file as File).text()).toBe("<h1>Hello</h1>");
    expect(formData.get("printBackground")).toBe("true");
    expect(formData.get("preferCssPageSize")).toBe("true");
    expect(formData.has("paperWidth")).toBe(false);
    expect(formData.has("paperHeight")).toBe(false);
  });

  it("throws when Gotenberg rejects the request", async function testRenderFailure() {
    vi.stubEnv("GOTENBERG_BASE_URL", "https://gotenberg.example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn(async function mockFetch() {
        return new Response("Unavailable", {
          status: 503,
        });
      })
    );

    await expect(renderHtmlToPdf({ html: "<h1>Hello</h1>" })).rejects.toThrow(
      "Gotenberg HTML to PDF request failed with status 503."
    );
  });

  it("aborts requests after the configured timeout", async function testRenderTimeout() {
    vi.useFakeTimers();
    vi.stubEnv("GOTENBERG_BASE_URL", "https://gotenberg.example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn(function mockFetch(_input: RequestInfo | URL, init?: RequestInit) {
        return new Promise<Response>(function resolveOnAbort(_resolve, reject) {
          init?.signal?.addEventListener("abort", function handleAbort() {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      })
    );

    const renderPromise = renderHtmlToPdf({
      html: "<h1>Hello</h1>",
      timeoutMs: 10,
    });
    const expectation = expect(renderPromise).rejects.toThrow(
      "Gotenberg HTML to PDF request timed out."
    );

    await vi.advanceTimersByTimeAsync(10);

    await expectation;
    vi.useRealTimers();
  });
});
