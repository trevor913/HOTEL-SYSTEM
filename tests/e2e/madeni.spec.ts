import { expect, test } from "@playwright/test";

// E2E #2 (§13): create debt → record payment → settled stamp + SMS receipt
test("create a debt, settle it, see the stamp and SMS receipt", async ({ page }) => {
  await page.goto("/dashboard/madeni");
  await page.getByRole("button", { name: /Deni Jipya/ }).last().click();
  await page.getByPlaceholder("Tafuta mteja…").fill("Zawadi Test");
  await page.getByRole("button", { name: /Mteja mpya/ }).click();
  await page.getByPlaceholder("Simu (hiari) — 07XX XXX XXX").fill("0799123456");
  await page.getByRole("button", { name: "Sawa" }).click();
  for (const k of ["3", "5", "0"]) await page.getByRole("button", { name: k, exact: true }).click();
  await page.getByRole("button", { name: "Hifadhi Deni" }).click();

  await page.getByText("Zawadi Test").click();
  await page.getByRole("button", { name: "Rekodi Malipo" }).click();
  await page.getByRole("button", { name: "Lipa Yote" }).click();
  await expect(page.getByText(/Deni Limelipwa!/)).toBeVisible();

  await page.goto("/dashboard/settings/outbox");
  await expect(page.getByText(/Deni lako kwa Nourish Hotel limelipwa lote/)).toBeVisible();
});
