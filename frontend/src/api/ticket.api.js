import api from "./axios";

export async function fetchTickets(params = {}) {
  const response = await api.get("/tickets", {
    params,
  });

  return response.data;
}

export async function fetchTicketById(id) {
  const response = await api.get(`/tickets/${id}`);

  return response.data;
}

export async function updateTicket(id, changes) {
  const response = await api.patch(`/tickets/${id}`, changes);

  return response.data;
}

export async function importTickets(tickets) {
  const response = await api.post("/tickets/import", { tickets });

  return response.data;
}

export async function fetchTicketStats() {
  const response = await api.get("/stats");

  return response.data;
}
