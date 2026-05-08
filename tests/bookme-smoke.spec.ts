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
