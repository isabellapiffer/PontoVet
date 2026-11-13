// Cadastrar pet: gavetas e medicações dentro da doença em tratamento.
// Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA } from "./supabaseFalso.js";

test.beforeEach(async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/meus-animais");
  await page.getByRole("button", { name: "Cadastrar pet" }).click();
});

test("clicar no título fecha e abre cada gaveta", async ({ page }) => {
  const dados = page.getByRole("button", { name: "Dados do animal" });
  const historico = page.getByRole("button", { name: "Histórico clínico" });

  // Começa: Dados aberta, Histórico fechada
  await expect(dados).toHaveAttribute("aria-expanded", "true");
  await expect(historico).toHaveAttribute("aria-expanded", "false");

  await dados.click();
  await expect(dados).toHaveAttribute("aria-expanded", "false");

  await historico.click();
  await expect(historico).toHaveAttribute("aria-expanded", "true");
});

test('duas medicações na mesma doença: "Remover medicação" tira só aquela', async ({ page }) => {
  await page.getByRole("button", { name: "Histórico clínico" }).click();
  await page.getByRole("button", { name: /Doenças em tratamento/ }).click();

  const topico = page.locator(".topico", { hasText: "Doenças em tratamento" });
  await topico.getByRole("button", { name: "Sim", exact: true }).first().click();
  await topico.getByPlaceholder("Ex: Diabetes").fill("Diabetes");

  // Medicação contínua: Sim (já abre a 1ª em branco)
  await topico.getByRole("button", { name: "Sim", exact: true }).nth(1).click();
  const nomes = topico.getByPlaceholder("Ex: Apoquel");
  await nomes.first().fill("Insulina");
  await topico.getByRole("button", { name: "+ Adicionar medicação" }).click();
  await nomes.nth(1).fill("Vetmedin");

  // Remove a 1ª (Insulina): só a Vetmedin fica
  await topico.getByRole("button", { name: "Remover medicação" }).first().click();
  await expect(nomes).toHaveCount(1);
  await expect(nomes.first()).toHaveValue("Vetmedin");
});
