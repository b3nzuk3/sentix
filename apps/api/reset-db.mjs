import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
  try {
    // Use raw SQL to completely wipe and reset (cascades)
    await prisma.$executeRaw`TRUNCATE TABLE "Signal" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Analysis" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Theme" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Decision" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Persona" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Project" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "UserTeam" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Team" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Organization" CASCADE`;

    console.log('✅ Database wiped successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
