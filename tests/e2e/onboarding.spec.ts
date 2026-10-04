import { expect, test } from "@playwright/test";

// E2E #1 (§13): onboarding → first sale
test("onboard a new hotel and record the first sale", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByLabel(/Jina la hotel/).fill("Mama Test Hotel");
  await page.getByLabel(/Jina lako/).fill("Mama Test");
  await page.getByRole("button", { name: /Endelea/ }).click();
  await page.getByRole("button", { name: "Rongai" }).click();
  await page.getByRole("button", { name: /Endelea/ }).click();
  await page.getByRole("button", { name: /Endelea · \d+/ }).click();
  await page.getByRole("button", { name: "Ruka" }).click();
  await expect(page.getByText(/Karibu Hotel System/)).toBeVisible();
  await page.getByRole("button", { name: /Rekodi mauzo ya kwanza/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/mauzo/);
});
