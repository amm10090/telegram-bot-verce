/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@workspace/eslint-config/next.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
} 