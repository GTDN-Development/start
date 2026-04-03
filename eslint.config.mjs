import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

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
    plugins: {
      "react-hooks": reactHooks,
    },
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
      "react-hooks/set-state-in-effect": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportSpecifier[imported.name='useEffect']",
          message:
            "Raw useEffect is restricted. Follow .rules/use-effect-guidelines.md. Prefer render-time derivation, handlers, keys, server/data abstractions, or useSyncExternalStore. For mount/unmount sync with external systems, use @/hooks/use-mount-effect.",
        },
        {
          selector: "MemberExpression[object.name='React'][property.name='useEffect']",
          message:
            "Raw useEffect is restricted. Follow .rules/use-effect-guidelines.md. Prefer render-time derivation, handlers, keys, server/data abstractions, or useSyncExternalStore. For mount/unmount sync with external systems, use @/hooks/use-mount-effect.",
        },
      ],
    },
  },
  {
    files: ["src/hooks/use-mount-effect.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // Temporary audited exceptions while the project is being refactored away from raw useEffect.
    files: [
      "src/app/[[]locale[]]/error.tsx",
      "src/components/layout/floating-bar.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: [
      "src/app/layout.tsx",
      "src/components/ui/**/*.{ts,tsx}",
      "src/hooks/use-mobile.ts",
      "src/lib/utils.ts",
      "tests/**/*.cjs",
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "func-style": "off",
      quotes: "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
