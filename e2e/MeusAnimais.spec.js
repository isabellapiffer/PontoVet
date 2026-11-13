// Meus Animais: cards dos pets.
// Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA } from "./supabaseFalso.js";

test("pet sem raça: a linha da raça não aparece", async ({ page }) => {
  const semRaca = {
    ...DADOS_ANA,
    pets: [
      { ...DADOS_ANA.pets[0], id: "pet-luna", nome: "Luna", raca: "Vira-lata (SRD)" },
      { ...DADOS_ANA.pets[0], id: "pet-thor", nome: "Thor", raca: null },
    ],
  };
  await usarSupabaseFalso(page, semRaca);
  await page.goto("/meus-animais");

  const luna = page.locator(".card-pet", { hasText: "Luna" });
  const thor = page.locator(".card-pet", { hasText: "Thor" });
  await expect(luna.locator(".card-vet-local")).toHaveText("Vira-lata (SRD)");
  await expect(thor.locator(".card-vet-local")).toHaveCount(0);
});

test("pet sem foto: aparece a imagem padrão da espécie; espécie sem imagem: a patinha", async ({ page }) => {
  const semFoto = {
    ...DADOS_ANA,
    pets: [
      { ...DADOS_ANA.pets[0], id: "pet-luna", nome: "Luna", especie: "Canino" },
      { ...DADOS_ANA.pets[0], id: "pet-x", nome: "Bolinha", especie: "Outra" },
    ],
  };
  await usarSupabaseFalso(page, semFoto);
  await page.goto("/meus-animais");

  const luna = page.locator(".card-pet", { hasText: "Luna" });
  const bolinha = page.locator(".card-pet", { hasText: "Bolinha" });
  await expect(luna.locator("img")).toHaveAttribute("src", "/especies/caes.png");
  await expect(bolinha.locator(".card-vet-foto-vazia .fa-paw")).toHaveCount(1);
});
