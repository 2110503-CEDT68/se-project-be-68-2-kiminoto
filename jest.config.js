module.exports = {
    testEnvironment: "node",
    coveragePathIgnorePatterns: ["/node_modules/"],
    testMatch: ["**/testCase/**/*.test.js"],
    collectCoverageFrom: [
        "controllers/**/*.js",
        "models/**/*.js",
        "!**/node_modules/**",
    ],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    testTimeout: 10000,
};
