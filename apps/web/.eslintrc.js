module.exports = {
  extends: ["@workspace/eslint-config/next.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
} 