const prisma = require("../config/db");

const { getPagination, paginatedResponse } = require("../utils/pagination");

const { escapeSearch } = require("../utils/search");

async function getResources(filters, role) {
  const { search, type, minCapacity, page } = filters;

  const limit = 10;
  const where = {};

  // Normal users can only see active resources
  if (role !== "ADMIN") {
    where.isActive = true;
  }

  if (type) {
    where.type = type;
  }

  if (minCapacity !== undefined) {
    where.capacity = {
      gte: minCapacity,
    };
  }

  if (search) {
    const searchTerm = escapeSearch(search);

    where.OR = [
      {
        name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ];
  }

  const pagination = getPagination(page, limit);

  const [data, total] = await prisma.$transaction(
    [
      prisma.resource.findMany({
        where,
        ...pagination,
        orderBy: [{ name: "asc" }, { id: "asc" }],
      }),

      prisma.resource.count({ where }),
    ],
    {
      isolationLevel: "RepeatableRead",
    },
  );

  return paginatedResponse(data, total, page, limit);
}

async function getResourceById(id, role) {
  const resource = await prisma.resource.findUnique({
    where: { id },
  });

  if (!resource) {
    return null;
  }

  if (role !== "ADMIN" && !resource.isActive) {
    return null;
  }

  return resource;
}

async function createResource(data) {
  return prisma.resource.create({
    data: {
      ...data,
      isActive: true,
    },
  });
}

async function updateResource(id, data) {
  return prisma.resource.update({
    where: { id },
    data,
  });
}

module.exports = {
  getResources,
  getResourceById,
  createResource,
  updateResource,
};
