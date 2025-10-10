module.exports = {
  root: true,
  ignorePatterns: ["backend", "docs", "node_modules", "dist"],
  overrides: [
    {
      files: ["frontend/**/*.{ts,tsx,js,jsx}"],
      extends: ["./frontend/.eslintrc.cjs"],
    },
  ],
};
