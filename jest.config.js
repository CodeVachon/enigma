module.exports = {
    roots: ["<rootDir>/src/"],
    setupFilesAfterEnv: ["jest-extended/all"],
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.+(ts)", "**/?(*.)+(spec|test).+(ts)"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    globals: {
        "ts-jest": {
            tsconfig: "./tsconfig.json"
        }
    },
    coverageReporters: ["json", "text", "lcov", "cobertura"]
};
