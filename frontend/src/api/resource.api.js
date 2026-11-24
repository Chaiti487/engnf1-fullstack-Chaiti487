import api from "./axios";

export async function fetchResources(params = {}) {
  const response = await api.get("/resources", {
    params,
  });

  return response.data;
}

export async function fetchResourceById(id) {
  const response = await api.get(`/resources/${id}`);

  return response.data;
}

export async function fetchAvailability(id, params) {
  const response = await api.get(`/resources/${id}/availability`, { params });

  return response.data;
}

export async function createResource(data) {
  const response = await api.post("/resources", data);

  return response.data;
}

export async function updateResource(id, data) {
  const response = await api.patch(`/resources/${id}`, data);

  return response.data;
}
