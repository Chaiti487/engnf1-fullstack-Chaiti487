require("dotenv").config();

const prisma = require("../src/config/db");

async function main() {
  const result = await prisma.ticket.deleteMany({
    where: {
      externalId: {
        startsWith: "BENCHMARK-",
      },
    },
  });

  const remaining = await prisma.ticket.count();

  console.log("Benchmark tickets deleted:", result.count);
  console.log("Remaining tickets:", remaining);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
