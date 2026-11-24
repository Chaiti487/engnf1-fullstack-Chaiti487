const test = require("node:test");
const assert = require("node:assert/strict");

const { classifyTicket } = require("../src/services/ticketClassifier");

const cases = [
  ["Refund request", "Please refund my payment", "BILLING", "HIGH"],
  ["Incorrect invoice", "Wrong service charge", "BILLING", "MEDIUM"],
  ["Locked out", "Cannot access my account", "LOGIN", "URGENT"],
  ["Password reset", "Reset link is unavailable", "LOGIN", "MEDIUM"],
  ["My package has not arrived", "Please help", "DELIVERY", "HIGH"],
  ["Shipping update", "Please provide tracking details", "DELIVERY", "MEDIUM"],
  ["Application error", "Dashboard returns 500", "BUG", "HIGH"],
  ["Production down", "Application crash", "BUG", "URGENT"],
  ["Dark mode", "Please add a new theme", "FEATURE_REQUEST", "MEDIUM"],
  ["REFUND REQUEST", "URGENT assistance needed", "BILLING", "URGENT"],
  ["Payment error", "Unable to complete payment", "BILLING", "HIGH"],
];

for (const [subject, body, category, priority] of cases) {
  test(subject, () => {
    const result = classifyTicket(subject, body);

    assert.deepEqual(result, {
      autoCategory: category,
      priority,
    });
  });
}
