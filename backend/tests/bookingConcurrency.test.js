const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = "http://localhost:5000/api";

test("Exactly one of ten concurrent booking requests succeeds", async () => {
  const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "user@triagesync.test",
      password: "User@123",
    }),
  });

  assert.equal(loginResponse.status, 200);

  const { token } = await loginResponse.json();

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const resourceResponse = await fetch(`${BASE_URL}/resources`, { headers });

  assert.equal(resourceResponse.status, 200);

  const resources = await resourceResponse.json();

  assert.ok(resources.data.length > 0);

  const resourceId = resources.data[0].id;

  const start = new Date();

  start.setUTCDate(start.getUTCDate() + 2);
  start.setUTCHours(14, 0, 0, 0);

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const payload = {
    resourceId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    purpose: "Concurrent booking race safety test",
  };

  const requests = Array.from({ length: 10 }, () =>
    fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }),
  );

  const responses = await Promise.all(requests);

  const results = await Promise.all(
    responses.map(async (response) => ({
      status: response.status,
      body: await response.json(),
    })),
  );

  const successful = results.filter((result) => result.status === 201);

  const conflicts = results.filter((result) => result.status === 409);

  console.log("Total requests:", results.length);
  console.log("Successful bookings:", successful.length);
  console.log("Conflicts:", conflicts.length);

  console.table(
    results.map((result, index) => ({
      request: index + 1,
      status: result.status,
      message: result.body.error?.message || "Booking created",
    })),
  );

  try {
    assert.equal(successful.length, 1);
    assert.equal(conflicts.length, 9);

    for (const conflict of conflicts) {
      assert.equal(conflict.body.error.code, "CONFLICT");

      assert.equal(
        conflict.body.error.message,
        "The requested slot is unavailable",
      );
    }
  } finally {
    // Release slots created by this test.
    for (const result of successful) {
      const cleanupResponse = await fetch(
        `${BASE_URL}/bookings/${result.body.id}/cancel`,
        {
          method: "PATCH",
          headers,
        },
      );

      assert.equal(cleanupResponse.status, 200);
    }
  }
});
