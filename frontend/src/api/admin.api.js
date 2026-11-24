import api from "./axios";

export async function fetchAdminStats() {
  const response = await api.get("/admin/stats");
  return response.data;
}
