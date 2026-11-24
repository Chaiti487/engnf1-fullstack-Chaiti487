import api from "./axios";

export async function createBooking(data) {
  const response = await api.post("/bookings", data);

  return response.data;
}

export async function fetchMyBookings(params = {}) {
  const response = await api.get("/bookings/mine", {
    params,
  });

  return response.data;
}

export async function fetchBookingById(id) {
  const response = await api.get(`/bookings/${id}`);

  return response.data;
}

export async function fetchAllBookings(params = {}) {
  const response = await api.get("/bookings", {
    params,
  });

  return response.data;
}

export async function cancelBooking(id) {
  const response = await api.patch(`/bookings/${id}/cancel`);

  return response.data;
}

export async function approveBooking(id) {
  const response = await api.patch(`/bookings/${id}/approve`);

  return response.data;
}

export async function rejectBooking(id, note) {
  const response = await api.patch(`/bookings/${id}/reject`, { note });

  return response.data;
}
