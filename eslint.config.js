import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**", "skills/**"] },
  { files: ["scripts/**/*.ts", "tests/**/*.ts"], extends: [js.configs.recommended, tseslint.configs.recommended] },
);
