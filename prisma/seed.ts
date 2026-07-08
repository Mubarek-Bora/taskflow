import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const owner = await prisma.user.upsert({
    where: { email: "demo@taskflow.dev" },
    update: {},
    create: {
      email: "demo@taskflow.dev",
      name: "Demo User",
      passwordHash,
      role: "ADMIN",
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Website Relaunch",
      description: "Redesign and rebuild the marketing site",
      ownerId: owner.id,
      tasks: {
        create: [
          {
            title: "Audit current site content",
            status: "DONE",
            position: 0,
            createdById: owner.id,
          },
          {
            title: "Design new homepage",
            status: "IN_PROGRESS",
            position: 0,
            createdById: owner.id,
          },
          {
            title: "Set up analytics",
            status: "TODO",
            position: 0,
            createdById: owner.id,
          },
          {
            title: "Write launch announcement",
            status: "TODO",
            position: 1,
            createdById: owner.id,
          },
        ],
      },
    },
  });

  console.log("Seeded user:", owner.email);
  console.log("Seeded project:", project.name);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
