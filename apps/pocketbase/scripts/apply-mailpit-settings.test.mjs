import assert from "node:assert/strict";
import test from "node:test";
import {
  MAILPIT_SMTP_HOST,
  MAILPIT_SMTP_PORT,
  createMailpitSettingsPatch,
  resolveMailpitApplyConfig,
} from "./apply-mailpit-settings.mjs";

test("resolveMailpitApplyConfig uses the canonical public env contract", function testResolve() {
  const config = resolveMailpitApplyConfig({
    NEXT_PUBLIC_PB_URL: "https://pb-dev.example.com",
    NEXT_PUBLIC_APP_URL: "http://localhost:3100",
    PB_SUPERUSER_EMAIL: "admin@example.com",
    PB_SUPERUSER_PASSWORD: "secret",
    MAIL_FROM_NAME: "Support",
    MAIL_FROM_ADDRESS: "support@example.com",
  });

  assert.equal(config.pbUrl, "https://pb-dev.example.com");
  assert.equal(config.pbAppUrl, "http://localhost:3100");
});

test("resolveMailpitApplyConfig requires shared mail sender values", function testSenderContract() {
  const config = resolveMailpitApplyConfig({
    NEXT_PUBLIC_PB_URL: "https://pb-dev.example.com",
    NEXT_PUBLIC_APP_URL: "http://localhost:3100",
    PB_SUPERUSER_EMAIL: "admin@example.com",
    PB_SUPERUSER_PASSWORD: "secret",
    MAIL_FROM_NAME: "Start App (Test)",
    MAIL_FROM_ADDRESS: "support@example.com",
  });

  assert.equal(config.pbAppUrl, "http://localhost:3100");
  assert.equal(config.senderName, "Start App (Test)");
  assert.equal(config.senderAddress, "support@example.com");
});

test("resolveMailpitApplyConfig requires NEXT_PUBLIC_APP_URL", function testMissingAppUrl() {
  assert.throws(function expectThrow() {
    resolveMailpitApplyConfig({
      NEXT_PUBLIC_PB_URL: "https://pb-dev.example.com",
      PB_SUPERUSER_EMAIL: "admin@example.com",
      PB_SUPERUSER_PASSWORD: "secret",
      MAIL_FROM_NAME: "Support",
      MAIL_FROM_ADDRESS: "support@example.com",
    });
  }, /NEXT_PUBLIC_APP_URL is required\./);
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
