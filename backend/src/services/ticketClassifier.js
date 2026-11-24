const categoryRules = [
  {
    category: "BILLING",
    keywords: ["refund", "invoice", "charge", "payment"],
  },
  {
    category: "LOGIN",
    keywords: ["password", "2fa", "sign in", "locked out", "login"],
  },
  {
    category: "DELIVERY",
    keywords: ["package", "arrived", "shipping", "tracking", "delivery"],
  },
  {
    category: "BUG",
    keywords: ["crash", "error", "500", "exception", "broken"],
  },
];

const priorityRules = [
  {
    priority: "URGENT",
    keywords: ["urgent", "production down", "locked out"],
  },
  {
    priority: "HIGH",
    keywords: ["error", "refund", "not arrived"],
  },
];

function classifyTicket(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();

  let category = "FEATURE_REQUEST";
  let priority = "MEDIUM";

  for (const rule of categoryRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      category = rule.category;
      break;
    }
  }

  for (const rule of priorityRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      priority = rule.priority;
      break;
    }
  }

  return {
    autoCategory: category,
    priority,
  };
}

module.exports = { classifyTicket };
