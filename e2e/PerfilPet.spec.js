// Perfil do pet: lápis e cartões.
// Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA } from "./supabaseFalso.js";

test.beforeEach(async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/pet/pet-luna");
});

test('"Nenhum agendamento por enquanto" aparece em Próximos agendamentos', async ({ page }) => {
  const secao = page.locator(".perfil-pet-secao", { hasText: "Próximos agendamentos" });
  await expect(secao.getByText("Nenhum agendamento por enquanto")).toBeVisible();
});

test("o lápis do card abre os Dados do animal", async ({ page }) => {
  await page.getByRole("button", { name: "Alterar dados do pet" }).click();
  await expect(page.getByRole("button", { name: "Dados do animal" })).toHaveAttribute("aria-expanded", "true");
});

test("o lápis do Histórico clínico abre o Histórico clínico", async ({ page }) => {
  await page.getByRole("button", { name: "Alterar histórico clínico" }).click();
  await expect(page.getByRole("button", { name: "Histórico clínico" })).toHaveAttribute("aria-expanded", "true");
});
