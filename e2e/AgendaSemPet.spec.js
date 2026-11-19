// Agenda de quem ainda não tem pet: o "+" aparece, mas avisa que precisa
// cadastrar um pet antes. Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA } from "./supabaseFalso.js";

test("sem pet: o + aparece e avisa para cadastrar um pet", async ({ page }) => {
  await usarSupabaseFalso(page, { ...DADOS_ANA, pets: [] });
  await page.goto("/agenda");

  await page.getByRole("button", { name: "Adicionar na agenda" }).click();

  await expect(page.getByText("Cadastre um pet para fazer um agendamento")).toBeVisible();
  // Não abre a gaveta de escolher o tipo
  await expect(page.getByRole("dialog", { name: "Adicionar na agenda" })).toHaveCount(0);

  await page.getByRole("button", { name: "Cadastrar pet" }).click();
  await expect(page).toHaveURL(/\/meus-animais$/);
});
