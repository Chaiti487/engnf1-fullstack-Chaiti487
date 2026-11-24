export const CATEGORIES = [
  "BILLING",
  "BUG",
  "FEATURE_REQUEST",
  "LOGIN",
  "DELIVERY",
];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function formatLabel(value) {
  return value ? value.replaceAll("_", " ") : "Unassigned";
}

export function formatDate(value) {
  return new Date(value).toLocaleString();
}

export function getErrorMessage(error) {
  return (
    error.response?.data?.error?.message ||
    "Something went wrong. Please try again."
  );
}
