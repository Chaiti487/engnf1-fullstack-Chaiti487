const { performance } = require("node:perf_hooks");

const BASE_URL = process.env.BENCHMARK_API_URL || "http://localhost:5000/api";

const WARMUP_REQUESTS = 5;
const MEASURED_REQUESTS = 30;

async function login() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email: "user@triagesync.test",
      password: "User@123",
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();

  return data.token;
}

async function measureRequest(token) {
  const start = performance.now();

  const response = await fetch(`${BASE_URL}/tickets?limit=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  const duration = performance.now() - start;

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (data.total < 500) {
    throw new Error("Benchmark requires at least 500 tickets.");
  }

  if (data.data.length !== 100) {
    throw new Error("Expected exactly 100 returned tickets.");
  }

  return {
    duration,
    total: data.total,
    returned: data.data.length,
  };
}

async function main() {
  const token = await login();

  console.log("Running warm-up requests...");

  for (let i = 0; i < WARMUP_REQUESTS; i++) {
    await measureRequest(token);
  }

  console.log("Running measured requests...");

  const durations = [];
  let totalTickets = 0;

  for (let i = 0; i < MEASURED_REQUESTS; i++) {
    const result = await measureRequest(token);

    durations.push(result.duration);
    totalTickets = result.total;

    console.log(`Request ${i + 1}: ${result.duration.toFixed(2)} ms`);
  }

  const sorted = [...durations].sort((a, b) => a - b);

  const average =
    durations.reduce((sum, value) => sum + value, 0) / durations.length;

  const middle = Math.floor(sorted.length / 2);

  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];

  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];

  console.log("\n--- BENCHMARK RESULTS ---");

  console.table({
    totalTickets,
    returnedPerRequest: 100,
    warmupRequests: WARMUP_REQUESTS,
    measuredRequests: MEASURED_REQUESTS,
    averageMs: average.toFixed(2),
    medianMs: median.toFixed(2),
    p95Ms: p95.toFixed(2),
    minimumMs: sorted[0].toFixed(2),
    maximumMs: sorted[sorted.length - 1].toFixed(2),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
