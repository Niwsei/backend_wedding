module.exports = {
   preset: 'ts-jest', // ใช้ ts-jest preset
   testEnvironment: 'node', // ใช้ Node.js เป็น test environment
   roots: ['<rootDir>/src'], // ระบุ directory ที่จะค้นหา test files
   testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'], // Pattern สำหรับหาไฟล์ Test
   transform: {
     '^.+\\.(ts|tsx)$': 'ts-jest'
   },

   moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // ระบุ file extensions ที่จะใช้
     // (Optional) Setup file run before each test file
  // setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  // (Optional) Collect coverage information
  // collectCoverage: true,
  // coverageDirectory: "coverage",
  // coverageProvider: "v8", // or "babel"
  // coverageReporters: ["json", "lcov", "text", "clover"],
  // (Optional) Clear mocks before every test
  clearMocks: true,
   // (Optional) Reset mocks before every test
  // resetMocks: true,
  // (Optional) Restore mocks before every test
  // restoreMocks: true,
  // (Optional) Global setup/teardown
  // globalSetup: '<rootDir>/src/tests/globalSetup.ts',
  // globalTeardown: '<rootDir>/src/tests/globalTeardown.ts',
  // (Optional) Timeout for tests
  // testTimeout: 30000, // 30 seconds
  // (Optional) Verbose output
  // verbose: true,
}