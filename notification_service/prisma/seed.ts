import { PrismaClient } from '@prisma/client';
import { seedNotificationEmailTemplates } from './seed/notificationEmailTemplate.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  await seedNotificationEmailTemplates();
  console.log('✅ All seeds completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
