const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  console.log('\n🔧 Global Teardown: Cleaning up test database...');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    // Truncate all tables after all tests to leave clean state
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

    console.log('✅ Database cleaned after tests');
  } catch (error) {
    console.error('❌ Global teardown error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database\n');
  }
};
