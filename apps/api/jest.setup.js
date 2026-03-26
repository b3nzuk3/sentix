/**
 * Jest setup file - runs before each test file
 * Provides database cleanup utilities
 */

const { PrismaClient } = require('@prisma/client');

let testPrisma = null;

// Get or create a Prisma client for tests
globalThis.getTestPrisma = function() {
  if (!testPrisma) {
    testPrisma = new PrismaClient();
  }
  return testPrisma;
};

// Clean database before each test
beforeEach(async () => {
  const prisma = getTestPrisma();

  // Truncate all tables in correct order to satisfy FK constraints
  try {
    await prisma.$executeRaw`TRUNCATE TABLE "UserTeam" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Theme" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Decision" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Persona" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Analysis" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Signal" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Project" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Team" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Organization" CASCADE`;
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  }
});

// Disconnect after all tests in this file
afterAll(async () => {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
});
