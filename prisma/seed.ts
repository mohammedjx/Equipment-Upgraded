import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const officer = await prisma.officer.upsert({
    where: { badgeId: "10001" },
    update: {},
    create: {
      badgeId: "10001",
      nuid: "900001",
      fullName: "John Example",
      photoData: null,
    },
  });

  await prisma.equipment.upsert({
    where: { qrCode: "RADIO-001" },
    update: {},
    create: {
      qrCode: "RADIO-001",
      label: "Radio 001",
      category: "Radio",
      description: "Primary handheld radio",
    },
  });

  await prisma.equipment.upsert({
    where: { qrCode: "KEYS-101" },
    update: {},
    create: {
      qrCode: "KEYS-101",
      label: "Master Keys 101",
      category: "Keys",
      description: "Main building key ring",
    },
  });

  console.log(`Seeded officer ${officer.fullName}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
