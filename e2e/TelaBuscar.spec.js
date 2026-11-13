// Tela Buscar atendimento: filtros e cards dos veterinários.
// Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA } from "./supabaseFalso.js";

test.beforeEach(async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/buscar");
});

test('os filtros já aparecem abertos e sem o "X" de fechar', async ({ page }) => {
  await expect(page.locator(".painel-busca")).toBeVisible();
  await expect(page.locator(".painel-busca .fa-xmark")).toHaveCount(0);
});

test('escolher "Exames" e depois "Não" mostra o aviso da requisição', async ({ page }) => {
  const aviso = page.getByText("É necessário requisição veterinária");
  await expect(aviso).toHaveCount(0);

  await page.getByPlaceholder("Selecione o serviço").click();
  await page.locator(".select-opcoes p", { hasText: "Exames" }).click();
  await page.getByPlaceholder("Selecione", { exact: true }).click();
  await page.locator(".select-opcoes p", { hasText: "Não" }).click();

  await expect(aviso).toBeVisible();
});

test("card do veterinário mostra só a cidade, sem distância", async ({ page }) => {
  const card = page.locator(".card-vet", { hasText: "Eduarda Lopes" });
  await expect(card.locator(".card-vet-local")).toHaveText("Balneário Camboriú");
  await expect(card).not.toContainText("km");
  await expect(card).not.toContainText("Na sua cidade");
});
