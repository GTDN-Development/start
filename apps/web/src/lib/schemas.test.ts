import { describe, expect, it } from "vitest";
import { passwordPolicySchema } from "@/lib/schemas";

describe("passwordPolicySchema", function describePasswordPolicySchema() {
  it("requires lowercase characters", function testLowercaseRequirement() {
    const schema = passwordPolicySchema({
      lowercase: "Password must contain a lowercase letter.",
    });

    expect(schema.safeParse("PASSWORD1!").success).toBe(false);
    expect(schema.safeParse("Password1!").success).toBe(true);
  });
});
