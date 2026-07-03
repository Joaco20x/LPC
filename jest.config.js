/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "<rootDir>/__test__/environments/jsdomWithFetch.js",
  roots: ["<rootDir>/__test__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.css$": "<rootDir>/__test__/__mocks__/styleMock.js",
  },
  setupFiles: ["<rootDir>/__test__/setupEnv.ts"],
  setupFilesAfterEnv: ["<rootDir>/__test__/setupTests.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.ts",
    "!src/app/**",
    "!src/**/types/**",
    "!src/**/components/**",
    "!src/**/swagger.ts",
    "!src/**/I*.ts",
  ],
  collectCoverage: true,
  coverageReporters: ["lcovonly", "text"],
  coverageDirectory: "<rootDir>/coverage",
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
    },
  },
};

module.exports = config;
