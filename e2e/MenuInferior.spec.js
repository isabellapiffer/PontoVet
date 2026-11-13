// Barra de baixo: o ícone da tela aberta fica "ativo" (cheio e sombreado).
// Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA } from "./supabaseFalso.js";

const telas = [
  { endereco: "/", ativo: "Início" },
  { endereco: "/buscar", ativo: "Buscar" },
  { endereco: "/meus-animais", ativo: "Animais" },
  { endereco: "/pet/pet-luna", ativo: "Animais" },
  { endereco: "/agenda", ativo: "Agenda" },
];

for (const { endereco, ativo } of telas) {
  test(`em ${endereco}, só "${ativo}" fica ativo na barra de baixo`, async ({ page }) => {
    await usarSupabaseFalso(page, DADOS_ANA);
    await page.goto(endereco);

    const barra = page.locator(".menu-inferior");
    await expect(barra.getByRole("button", { name: ativo })).toHaveClass(/menu-item-ativo/);
    await expect(barra.locator(".menu-item-ativo")).toHaveCount(1);
  });
}
