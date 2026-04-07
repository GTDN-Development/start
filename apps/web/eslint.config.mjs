import { defineConfig, globalIgnores } from "eslint/config";
import nextTs from "eslint-config-next/typescript";
import nextVitals from "eslint-config-next/core-web-vitals";
import reactHooks from "eslint-plugin-react-hooks";

const applicationFiles = ["src/**/*.{js,jsx,ts,tsx}"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
  {
    files: applicationFiles,
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
      "react-hooks/set-state-in-effect": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/link",
              message:
                "Do not import from next/link directly. Use @/components/ui/link for internal localized links.",
            },
          ],
        },
      ],
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
    files: [
      "src/app/[[]locale[]]/error.tsx",
      "src/components/layout/floating-bar.tsx",
      "src/components/ui/**/*.{ts,tsx}",
      "src/hooks/use-mobile.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["tests/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
