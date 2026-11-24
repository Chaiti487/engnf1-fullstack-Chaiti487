export const RESOURCE_TYPES = ["ROOM", "LAB", "EQUIPMENT"];

export const BOOKING_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

export const TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0");

  const minutes = index % 2 === 0 ? "00" : "30";

  return `${hours}:${minutes}`;
});

export function getLocalDate(date = new Date()) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toUTC(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function getDayRange(date) {
  const start = new Date(`${date}T00:00:00`);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function formatLocalTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
