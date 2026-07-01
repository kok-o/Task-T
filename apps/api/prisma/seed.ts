import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Create Owner ────────────────────────────────────────────────────────
  const ownerPassword = await bcrypt.hash('owner123', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@nailstudio.com' },
    update: {},
    create: {
      email: 'owner@nailstudio.com',
      passwordHash: ownerPassword,
      role: Role.OWNER,
    },
  });
  console.log('✅ Owner created:', owner.email);

  // ─── Create Masters with Users ───────────────────────────────────────────
  // (Fake masters removed)

  // ─── Create Services ─────────────────────────────────────────────────────
  const services = [
    { name: 'Маникюр классический', durationMinutes: 60, price: 2000 },
    { name: 'Маникюр + гель-лак', durationMinutes: 90, price: 3500 },
    { name: 'Педикюр классический', durationMinutes: 90, price: 2500 },
    { name: 'Педикюр + гель-лак', durationMinutes: 120, price: 4000 },
    { name: 'Снятие гель-лака', durationMinutes: 30, price: 800 },
    { name: 'Наращивание ногтей', durationMinutes: 180, price: 6000 },
    { name: 'Коррекция', durationMinutes: 90, price: 3000 },
    { name: 'Маникюр + педикюр', durationMinutes: 150, price: 5000 },
  ];

  const existingServices = await prisma.service.findMany({ select: { name: true } });
  const existingNames = new Set(existingServices.map((s) => s.name));
  const newServices = services.filter((s) => !existingNames.has(s.name));
  if (newServices.length > 0) {
    await prisma.service.createMany({ data: newServices });
  }
  console.log(`✅ ${services.length} services ensured`);

  // ─── Create Sample Clients ───────────────────────────────────────────────
  // (Fake clients removed)

  console.log('\n🎉 Seed complete!');
  console.log('\nLogin credentials:');
  console.log('  Owner:   owner@nailstudio.com / owner123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
