require("dotenv").config();

const bcrypt = require("bcryptjs");
const prisma = require("../src/config/db");

async function seedUsers() {
    const adminPasswordHash = await bcrypt.hash("Admin@123", 12);
    const userPasswordHash = await bcrypt.hash("User@123", 12);

    const admin = await prisma.user.upsert({
    where: {
        email: "admin@triagesync.test",
    },
    update: {},
    create: {
        name: "Admin Lead",
        email: "admin@triagesync.test",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
    },
    });

    const user = await prisma.user.upsert({
    where: {
        email: "user@triagesync.test",
    },
    update: {},
    create: {
        name: "Agent Demo",
        email: "user@triagesync.test",
        passwordHash: userPasswordHash,
        role: "USER",
    },
    });

    console.log("Admin account ready:", admin.email);
    console.log("Demo user account ready:", user.email);

    return { admin, user };
}

async function seedResources() {
  const resources = [
    {
      name: "Nexus Conference Room",
      type: "ROOM",
      capacity: 20,
      description: "Team meetings and live support discussions.",
      isActive: true,
    },
    {
      name: "Horizon Meeting Room",
      type: "ROOM",
      capacity: 10,
      description: "Customer consultations and incident reviews.",
      isActive: true,
    },
    {
      name: "Atlas Diagnostics Lab",
      type: "LAB",
      capacity: 30,
      description: "System diagnostics and technical troubleshooting.",
      isActive: true,
    },
    {
      name: "Vertex Testing Lab",
      type: "LAB",
      capacity: 25,
      description: "Software testing and issue reproduction.",
      isActive: true,
    },
    {
      name: "Pulse Network Analyzer",
      type: "EQUIPMENT",
      capacity: 2,
      description: "Network monitoring and connectivity diagnostics.",
      isActive: true,
    },
    {
      name: "Quantum Debug Station",
      type: "EQUIPMENT",
      capacity: 4,
      description: "Advanced debugging station under maintenance.",
      isActive: false,
    },
  ];

  for (const resource of resources) {
    await prisma.resource.upsert({
      where: {
        name: resource.name,
      },
      update: {},
      create: resource,
    });
  }

  console.log("6 resources seeded successfully!");
}


async function seedTickets(userId) {
  const tickets = [
    {
      externalId: "TS-001",
      subject: "Refund request for duplicate payment",
      body: "My subscription payment was deducted twice.",
      autoCategory: "BILLING",
      priority: "HIGH",
    },
    {
      externalId: "TS-002",
      subject: "Incorrect invoice amount",
      body: "The invoice contains an incorrect service charge.",
      autoCategory: "BILLING",
      priority: "MEDIUM",
    },
    {
      externalId: "TS-003",
      subject: "Payment receipt request",
      body: "Please provide a receipt for my recent payment.",
      autoCategory: "BILLING",
      priority: "LOW",
    },
    {
      externalId: "TS-004",
      subject: "Application crash during checkout",
      body: "The application crashes when submitting the form.",
      autoCategory: "BUG",
      priority: "MEDIUM",
    },
    {
      externalId: "TS-005",
      subject: "Urgent production down",
      body: "The dashboard returns a 500 error.",
      autoCategory: "BUG",
      priority: "URGENT",
    },
    {
      externalId: "TS-006",
      subject: "Broken dashboard layout",
      body: "Dashboard components overlap on mobile devices.",
      autoCategory: "BUG",
      priority: "MEDIUM",
    },
    {
      externalId: "TS-007",
      subject: "Dark mode support",
      body: "Please introduce a dark theme for the dashboard.",
      autoCategory: "FEATURE_REQUEST",
      priority: "LOW",
    },
    {
      externalId: "TS-008",
      subject: "Export reports as PDF",
      body: "We need an option to download analytics reports.",
      autoCategory: "FEATURE_REQUEST",
      priority: "MEDIUM",
    },
    {
      externalId: "TS-009",
      subject: "Custom notification preferences",
      body: "Allow users to customize notification settings.",
      autoCategory: "FEATURE_REQUEST",
      priority: "LOW",
    },
    {
      externalId: "TS-010",
      subject: "Unable to reset password",
      body: "The password reset link is not working.",
      autoCategory: "LOGIN",
      priority: "MEDIUM",
    },
    {
      externalId: "TS-011",
      subject: "Locked out of account",
      body: "I cannot sign in to my account. Please help urgently.",
      autoCategory: "LOGIN",
      priority: "URGENT",
    },
    {
      externalId: "TS-012",
      subject: "2FA verification issue",
      body: "The authentication code is not being accepted.",
      autoCategory: "LOGIN",
      priority: "MEDIUM",
    },
    {
      externalId: "TS-013",
      subject: "My package has not arrived",
      body: "The expected delivery date has already passed.",
      autoCategory: "DELIVERY",
      priority: "HIGH",
    },
    {
      externalId: "TS-014",
      subject: "Shipping tracking unavailable",
      body: "The tracking information has not been updated.",
      autoCategory: "DELIVERY",
      priority: "MEDIUM",
    },
    {
      externalId: "TS-015",
      subject: "HTML rendering error",
      body: '<script>alert("XSS test")</script><h1>Test heading</h1>',
      autoCategory: "BUG",
      priority: "HIGH",
    },
  ];

  for (const [index, ticket] of tickets.entries()) {
    const isReviewed = index < 3;

    const status =
      index === 0
        ? "IN_PROGRESS"
        : index === 1
          ? "RESOLVED"
          : index === 2
            ? "CLOSED"
            : "OPEN";

    await prisma.ticket.upsert({
      where: {
        externalId: ticket.externalId,
      },
      update: {},
      create: {
        ...ticket,
        category: ticket.autoCategory,
        status,
        isReviewed,
        isHumanOverride: false,
        assigneeId: isReviewed ? userId : null,

        ...(isReviewed
          ? {
              events: {
                create: [
                  {
                    field: "status",
                    oldValue: "OPEN",
                    newValue: status,
                    actor: "user@triagesync.test",
                  },
                  {
                    field: "assigneeId",
                    oldValue: null,
                    newValue: userId,
                    actor: "user@triagesync.test",
                  },
                ],
              },
            }
          : {}),
      },
    });
  }

  console.log("15 support tickets seeded successfully!");
}

async function main() {
  console.log("Starting TriageSync database seeding...");

  const { user } = await seedUsers();

  await seedResources();
  await seedTickets(user.id);

  console.log("Database seeding completed successfully!");
}

main()
    .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
    })
    .finally(async () => {
    await prisma.$disconnect();
    });
