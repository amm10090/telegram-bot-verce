module.exports = {
  extends: ["next", "turbo", "prettier"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "warn",
    "turbo/no-undeclared-env-vars": "warn",
  },
};
