import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const EN_MESSAGES_PATH = path.join(WEB_ROOT, "messages/en.json");
const CS_MESSAGES_PATH = path.join(WEB_ROOT, "messages/cs.json");

type BlogMessages = {
  pages?: {
    blog?: {
      title?: string;
      description?: string;
      readMore?: string;
      loadMore?: string;
      backToBlog?: string;
      empty?: {
        title?: string;
        description?: string;
      };
    };
  };
};

describe("blog message contract", function describeBlogMessageContract() {
  it("defines the blog empty-state copy in both locales", function testBlogEmptyStateMessages() {
    const enMessages = readMessages(EN_MESSAGES_PATH);
    const csMessages = readMessages(CS_MESSAGES_PATH);

    expect(enMessages.pages?.blog?.empty?.title).toBeTruthy();
    expect(enMessages.pages?.blog?.empty?.description).toBeTruthy();
    expect(csMessages.pages?.blog?.empty?.title).toBeTruthy();
    expect(csMessages.pages?.blog?.empty?.description).toBeTruthy();
  });
});

function readMessages(filePath: string): BlogMessages {
  return JSON.parse(readFileSync(filePath, "utf8")) as BlogMessages;
}
