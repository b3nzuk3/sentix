import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  try {
    // Delete in correct order (dependencies first)
    await prisma.userTeam.deleteMany();
    await prisma.theme.deleteMany();
    await prisma.decision.deleteMany();
    await prisma.persona.deleteMany();
    await prisma.analysis.deleteMany();
    await prisma.signal.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany(); // Delete users before orgs
    await prisma.team.deleteMany();
    await prisma.organization.deleteMany();
    console.log('All data cleaned');
  } catch (err) {
    console.error('Clean failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
