import { expect, test } from "@playwright/test";

test("guest demo and admin dashboard render", async ({ page }) => {
  await page.goto("/demo?hotel=sriram-hotel");
  await expect(page.getByText("AI front desk", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();

  await page.goto("/admin?hotel=sriram-hotel");
  await expect(page.getByText("Hotel admin workspace")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reservations" })).toBeVisible();
  await expect(page.getByPlaceholder("Search booking, guest, contact")).toBeVisible();
  await expect(page.getByText("Recent AI activity")).toBeVisible();
});

test("front desk check-in workflow returns a grounded tool result", async ({ request }) => {
  await request.post("/api/connectors/seed", {
    data: { reset: true },
  });

  const response = await request.post("/api/agent", {
    data: {
      hotelSlug: "sriram-hotel",
      messages: [{ role: "user", content: "I'm checking in, booking ID BKM-2001." }],
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.toolCalls).toContain("checkin_guest");
  expect(body.message).toContain("Checked in");
  expect(body.card?.status).toBe("Checked In");
});

test("admin can manually override reservation check-in", async ({ request }) => {
  await request.post("/api/connectors/seed", {
    data: { reset: true },
  });

  const response = await request.post("/api/hotels/sriram-hotel/reservations/BKM-2001/status", {
    data: { action: "checkin" },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.message).toContain("Checked in");
  expect(body.reservation?.status).toBe("Checked In");
});

test("payment link API fails closed when Razorpay is not configured", async ({ request }) => {
  const response = await request.post("/api/payments/razorpay-link", {
    data: {
      hotelSlug: "sriram-hotel",
      bookingId: "BKM-2001",
      amountInPaise: 499900,
      description: "Room payment for BKM-2001",
      customer: {
        name: "James Lee",
        email: "james@example.com",
        phone: "+916175550192",
      },
    },
  });

  expect(response.status()).toBe(501);
  const body = await response.json();
  expect(body.error).toContain("Razorpay is not configured");
});

test("Razorpay webhook fails closed when webhook secret is not configured", async ({ request }) => {
  const response = await request.post("/api/payments/razorpay-webhook", {
    headers: {
      "x-razorpay-signature": "invalid",
    },
    data: {
      event: "payment_link.paid",
      payload: {
        payment_link: {
          entity: {
            id: "plink_test",
            reference_id: "BKM-2001",
            status: "paid",
          },
        },
      },
    },
  });

  expect(response.status()).toBe(501);
  const body = await response.json();
  expect(body.error).toContain("webhook is not configured");
});
