import PocketBase from "pocketbase";
import { describe, expect, it } from "vitest";
import { authConfig } from "@/config/auth";
import { createPocketBaseAuthCookieMutations } from "./pocketbase-server";

describe("pocketbase-server auth cookies", function describePocketBaseServerAuthCookies() {
  it("exports persistent auth cookies with the PocketBase token expiry", function testPersistentAuthCookieExpiry() {
    const tokenExpiresAtSeconds = 1_812_345_600;
    const pb = createAuthenticatedPocketBaseClient(tokenExpiresAtSeconds);

    const mutations = createPocketBaseAuthCookieMutations(pb, {
      sessionOnly: false,
    });

    const authCookie = mutations.find(
      (mutation) => mutation.name === authConfig.cookies.authCookieName
    );
    const persistCookie = mutations.find(
      (mutation) => mutation.name === authConfig.cookies.persistCookieName
    );

    expect(authCookie?.expires).toEqual(new Date(tokenExpiresAtSeconds * 1000));
    expect(authCookie?.maxAge).toBeUndefined();
    expect(persistCookie?.value).toBe("1");
    expect(persistCookie?.maxAge).toBe(authConfig.cookies.persistCookieMaxAgeSeconds);
  });

  it("exports session-only auth cookies without persistent expiry metadata", function testSessionOnlyAuthCookieExpiry() {
    const pb = createAuthenticatedPocketBaseClient(1_812_345_600);

    const mutations = createPocketBaseAuthCookieMutations(pb, {
      sessionOnly: true,
    });

    const authCookie = mutations.find(
      (mutation) => mutation.name === authConfig.cookies.authCookieName
    );
    const persistCookie = mutations.find(
      (mutation) => mutation.name === authConfig.cookies.persistCookieName
    );

    expect(authCookie?.expires).toBeUndefined();
    expect(authCookie?.maxAge).toBeUndefined();
    expect(persistCookie?.value).toBe("0");
    expect(persistCookie?.maxAge).toBeUndefined();
  });
});

function createAuthenticatedPocketBaseClient(tokenExpiresAtSeconds: number): PocketBase {
  const pb = new PocketBase("https://pocketbase.test");

  pb.authStore.save(createJwt({ exp: tokenExpiresAtSeconds }), {
    id: "user_1",
    collectionId: "_pb_users_auth_",
    collectionName: "users",
    verified: true,
  });

  return pb;
}

function createJwt(payload: Record<string, unknown>): string {
  return [encodeBase64Url({ alg: "none", typ: "JWT" }), encodeBase64Url(payload), "signature"].join(
    "."
  );
}

function encodeBase64Url(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}
