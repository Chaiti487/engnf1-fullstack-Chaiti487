function getPagination(page, limit) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

function paginatedResponse(data, total, page, limit) {
  return {
    data,
    page,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = {
  getPagination,
  paginatedResponse,
};
