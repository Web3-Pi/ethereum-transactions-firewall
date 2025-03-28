import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
  { files: ["**/*.ts"] },
  { files: ["**/*.ts"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.ts"], plugins: { js }, extends: ["js/recommended"] },
  tseslint.configs.recommended,
  {
    ignores: [
      "node_modules",
      "dist",
      "dist-deb",
      "config",
      "public",
      "test",
      "worker",
    ],
  },
]);
