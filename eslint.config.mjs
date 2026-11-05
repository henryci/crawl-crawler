// Single ESLint flat config for the whole workspace. Each package's `lint`
// script runs `eslint` from its own directory; ESLint walks up to find this
// file, so the rules below are scoped by path rather than by package.
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/coverage/**",
    "apps/web/next-env.d.ts",
    "apps/web/public/**",
  ]),

  // Libraries and scripts: plain TypeScript on Node.
  {
    files: ["packages/**/*.ts", "scripts/**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // The Next.js app: React, hooks, accessibility and Next rules on top of TS.
  {
    files: ["apps/web/**/*.{ts,tsx,mjs}"],
    extends: [nextVitals, nextTs],
    settings: {
      next: { rootDir: "apps/web/" },
    },
    rules: {
      // App Router only; there is no pages/ directory for this rule to scan.
      "@next/next/no-html-link-for-pages": "off",
      // Apostrophes and quotes in JSX text are valid and common in the
      // prose-heavy pages. Keep the rule for the characters that indicate
      // a real mistake (a stray closing tag or brace).
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
      // React Compiler-era rules from eslint-plugin-react-hooks 7. The
      // codebase predates them and leans on URL-sync effects and
      // "latest value" refs; surfaced as warnings to guide new code
      // without failing the build. Tighten to "error" once addressed.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },

  // Shared TypeScript conventions.
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
    },
  },
]);
