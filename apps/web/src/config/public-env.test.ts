import { describe, expect, it } from "vitest";
import { getPocketBaseUrl, getPublicAppUrl } from "./public-env";

describe("public env config", function describePublicEnvConfig() {
  it("normalizes trailing slashes for public urls", function testNormalizeTrailingSlashes() {
    expect(
      getPublicAppUrl({
        NEXT_PUBLIC_APP_URL: "https://start.example.com///",
      })
    ).toBe("https://start.example.com");
    expect(
      getPocketBaseUrl({
        NEXT_PUBLIC_PB_URL: "https://pb.example.com///",
      })
    ).toBe("https://pb.example.com");
  });

  it("throws clear errors when required envs are missing", function testMissingEnvErrors() {
    expect(function expectMissingAppUrl() {
      getPublicAppUrl({});
    }).toThrow("Missing NEXT_PUBLIC_APP_URL environment variable.");

    expect(function expectMissingPocketBaseUrl() {
      getPocketBaseUrl({});
    }).toThrow("Missing NEXT_PUBLIC_PB_URL environment variable.");
  });
});
