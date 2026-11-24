require("dotenv").config();

const prisma = require("../src/config/db");

const categories = ["BILLING", "BUG", "FEATURE_REQUEST", "LOGIN", "DELIVERY"];

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const subjects = [
  "Payment refund request",
  "Application error detected",
  "Request for dark mode",
  "Unable to login",
  "Package delivery delayed",
];

async function main() {
  const tickets = Array.from({ length: 600 }, (_, index) => {
    const category = categories[index % categories.length];

    return {
      externalId: `BENCHMARK-${String(index + 1).padStart(4, "0")}`,

      subject: `${subjects[index % subjects.length]} ${index + 1}`,

      body: `Synthetic ticket ${index + 1} generated for API performance benchmarking.`,

      autoCategory: category,
      category,

      priority: priorities[index % priorities.length],

      status: statuses[index % statuses.length],

      isHumanOverride: false,

      isReviewed: statuses[index % statuses.length] !== "OPEN",
    };
  });

  const result = await prisma.ticket.createMany({
    data: tickets,
    skipDuplicates: true,
  });

  const benchmarkCount = await prisma.ticket.count({
    where: {
      externalId: {
        startsWith: "BENCHMARK-",
      },
    },
  });

  const total = await prisma.ticket.count();

  console.log("New benchmark tickets:", result.count);
  console.log("Benchmark tickets:", benchmarkCount);
  console.log("Total database tickets:", total);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
