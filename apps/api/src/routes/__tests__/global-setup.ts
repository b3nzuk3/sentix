import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export default async () => {
  const prisma = new PrismaClient();

  try {
    // Truncate all tables in correct order to satisfy FK constraints
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

    console.log('✅ Global setup: Database truncated');
  } finally {
    await prisma.$disconnect();
  }
};
