import { getJestProjectsAsync } from '@nx/jest';

export default async () => ({
  projects: await getJestProjectsAsync(),
  testEnvironment: 'node', // Change default environment to node
  setupFiles: ['<rootDir>/jest.setup.ts'], // Add setup file if you don't have one
});
