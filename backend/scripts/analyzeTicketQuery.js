require("dotenv").config();

const prisma = require("../src/config/db");

async function main() {
  const result = await prisma.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT *
    FROM "tickets"
    ORDER BY "createdAt" DESC, "id" ASC
    LIMIT 100
  `;

  console.log("\n--- PostgreSQL Query Execution Plan ---\n");

  for (const row of result) {
    console.log(row["QUERY PLAN"]);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
