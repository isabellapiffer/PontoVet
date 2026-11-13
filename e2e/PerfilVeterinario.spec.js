// Perfil do veterinário: rodapé de quem está logada.
// Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA } from "./supabaseFalso.js";

test('logada: o "Fazer login" não aparece nem por um instante', async ({ page }) => {
  // Um "vigia" fica olhando a tela desde o primeiro instante e anota
  // se o texto "Fazer login" aparecer em algum momento
  await page.addInitScript(() => {
    window.viuFazerLogin = false;
    new MutationObserver(() => {
      if (document.body?.innerText.includes("Fazer login")) window.viuFazerLogin = true;
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/profissional/1");

  await expect(page.getByRole("button", { name: "Agendar" })).toBeVisible();
  expect(await page.evaluate(() => window.viuFazerLogin)).toBe(false);
});

test('sem login: aparece "Fazer login" e só a cidade', async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA, { logada: false });
  await page.goto("/profissional/1");

  await expect(page.getByRole("button", { name: "Fazer login" })).toBeVisible();
  await expect(page.locator(".perfil-valor").first()).toHaveText("Florianópolis");
});
