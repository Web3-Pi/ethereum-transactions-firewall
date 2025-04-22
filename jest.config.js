/** @type {import('jest').Config} */
const config = {
  testMatch: [
    "<rootDir>/src/**/*.spec.ts",
    "<rootDir>/test/integration/**/*.spec.ts",
  ],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.jsx?$": "$1",
    "node-fetch": "<rootDir>/node_modules/node-fetch-jest",
  },

  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        // Your SWC config here
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
};

export default config;
