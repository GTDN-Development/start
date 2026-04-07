import assert from "node:assert/strict";
import test from "node:test";
import {
  MAILPIT_SMTP_HOST,
  MAILPIT_SMTP_PORT,
  assertSafePocketBaseTarget,
  createMailpitSettingsPatch,
  resolveMailpitApplyConfig,
} from "./apply-mailpit-settings.mjs";

test("resolveMailpitApplyConfig prefers PB_URL over NEXT_PUBLIC_PB_URL", function testResolve() {
  const config = resolveMailpitApplyConfig({
    PB_URL: "https://pb-dev.example.com",
    NEXT_PUBLIC_PB_URL: "https://ignored.example.com",
    PB_SUPERUSER_EMAIL: "admin@example.com",
    PB_SUPERUSER_PASSWORD: "secret",
    PB_APP_URL: "http://localhost:3100",
    PB_MAIL_FROM_NAME: "Support",
    PB_MAIL_FROM_ADDRESS: "support@example.com",
  });

  assert.equal(config.pbUrl, "https://pb-dev.example.com");
});

test("resolveMailpitApplyConfig falls back to shared mail sender values", function testSenderFallback() {
  const config = resolveMailpitApplyConfig({
    NEXT_PUBLIC_PB_URL: "https://pb-dev.example.com",
    PB_SUPERUSER_EMAIL: "admin@example.com",
    PB_SUPERUSER_PASSWORD: "secret",
    MAIL_FROM_NAME: "Start App (Test)",
    MAIL_FROM_ADDRESS: "support@example.com",
  });

  assert.equal(config.pbAppUrl, "http://localhost:3100");
  assert.equal(config.senderName, "Start App (Test)");
  assert.equal(config.senderAddress, "support@example.com");
});

test("assertSafePocketBaseTarget rejects production-like hosts by default", function testGuard() {
  assert.throws(function expectThrow() {
    assertSafePocketBaseTarget("https://pocketbase-start.up.railway.app", {});
  });
});

test("assertSafePocketBaseTarget allows explicit production override", function testOverride() {
  assert.doesNotThrow(function expectNoThrow() {
    assertSafePocketBaseTarget("https://pocketbase-start.up.railway.app", {
      ALLOW_PB_SETTINGS_WRITE: "production",
    });
  });
});

test("createMailpitSettingsPatch preserves unrelated settings", function testPatch() {
  const patch = createMailpitSettingsPatch(
    {
      meta: {
        appName: "Start App (DEV)",
        hideControls: false,
        senderName: "Old sender",
        senderAddress: "old@example.com",
      },
      smtp: {
        enabled: true,
        host: "smtp.previous-provider.invalid",
        port: 2525,
        authMethod: "PLAIN",
        tls: false,
        username: "user",
        localName: "localhost",
      },
    },
    {
      pbAppUrl: "http://localhost:3100",
      senderName: "Support",
      senderAddress: "support@example.com",
    }
  );

  assert.deepEqual(patch.meta, {
    appName: "Start App (DEV)",
    hideControls: false,
    appURL: "http://localhost:3100",
    senderName: "Support",
    senderAddress: "support@example.com",
  });
  assert.deepEqual(patch.smtp, {
    enabled: true,
    host: MAILPIT_SMTP_HOST,
    port: MAILPIT_SMTP_PORT,
    authMethod: "",
    tls: false,
    username: "",
    password: "",
    localName: "localhost",
  });
});
