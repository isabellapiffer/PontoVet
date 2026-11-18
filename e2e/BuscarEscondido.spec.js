// Enquanto a parte dos veterinários não fica pronta, o Buscar fica escondido
// (MOSTRAR_BUSCAR = false em src/recursos.js). Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA } from "./supabaseFalso.js";
import { MOSTRAR_BUSCAR } from "../src/recursos.js";

test.skip(MOSTRAR_BUSCAR, "O Buscar está ligado em src/recursos.js");

test("tela inicial sem o Buscar: nem na barra de baixo, nem a barra de busca", async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/");

  await expect(page.locator(".menu-inferior").getByRole("button", { name: "Início" })).toBeVisible();
  await expect(page.locator(".menu-inferior").getByRole("button", { name: "Buscar" })).toHaveCount(0);
  await expect(page.getByText("Buscar veterinário, vacina, exame")).toHaveCount(0);
});

test("o endereço /buscar mostra Página não encontrada", async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/buscar");

  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});
