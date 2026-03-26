const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  console.log('\n🔧 Global Setup: Initializing test database...');

  const prisma = new PrismaClient();

  try {
    // Wait for DB connection
    await prisma.$connect();
    console.log('✅ Connected to test database');

    // Truncate all tables before any tests run
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

    console.log('✅ Database truncated - ready for tests');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    // Disconnect - individual tests will create their own connections as needed
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database\n');
  }
};
