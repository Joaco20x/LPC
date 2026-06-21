/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__test__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/__test__/setupEnv.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/app/**",
    "!src/**/*.d.ts",
    "!src/**/validator.ts",
    "!src/**/swagger.ts",
    "!src/**/types/**",
    "!src/**/api/**",
    "!src/**/I*.ts",
    "!src/**/IDatabaseService.ts",
    "!src/**/components/**",
  ],
  coverageReporters: ["lcovonly", "text", "cobertura"],
  coverageDirectory: "<rootDir>/coverage",
};

module.exports = config;
