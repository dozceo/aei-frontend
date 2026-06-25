const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: [
    "<rootDir>/src/lib/__tests__/**/*.(test|spec).(ts|tsx)",
    "<rootDir>/src/lib/intelligence/__tests__/**/*.(test|spec).(ts|tsx)",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/src/lib/intelligence/ml/__tests__",
    "<rootDir>/src/lib/intelligence/academic/__tests__",
    "<rootDir>/src/lib/intelligence/anps/__tests__",
  ],
};

module.exports = createJestConfig(config);
