import { expect, test } from "@playwright/test";

// E2E #3 (§13): public order → Oda queue
test("place a public menu order and see it in the Oda queue", async ({ page }) => {
  await page.goto("/m/nourish-hotel");
  await page.getByRole("button", { name: /Ongeza/ }).first().click();
  await page.getByRole("button", { name: /Agiza/ }).click();
  await page.getByPlaceholder("Jina lako").fill("Zawadi E2E");
  await page.getByPlaceholder(/Namba ya simu/).fill("0799123456");
  await page.getByRole("tab", { name: "Lipa ukifika" }).click();
  await page.getByRole("button", { name: /Tuma oda/ }).click();
  await expect(page.getByText(/Oda imepokelewa/).first()).toBeVisible();
  await page.goto("/dashboard/oda");
  await expect(page.getByText("Zawadi E2E").first()).toBeVisible();
});
