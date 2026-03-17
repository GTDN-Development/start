import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",

      // warnings - don't break build
      "prefer-const": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "func-style": ["warn", "declaration", { allowArrowFunctions: false }],
      quotes: ["warn", "double", { avoidEscape: true, allowTemplateLiterals: true }],
    },
  },
  {
    files: [
      "src/app/layout.tsx",
      "src/components/ui/**/*.{ts,tsx}",
      "src/hooks/use-mobile.ts",
      "src/lib/utils.ts",
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "func-style": "off",
      quotes: "off",
    },
  },
]);

export default eslintConfig;
