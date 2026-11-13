// Tela inicial: menu sanduíche e carrossel "Meus animais".
// Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA, TUTORA } from "./supabaseFalso.js";

test('menu sanduíche: "Sair da conta" é a última opção', async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/");

  await page.getByRole("button", { name: "Abrir menu" }).click();
  const opcoes = page.locator(".menu-superior-opcao");
  await expect(opcoes.last()).toHaveText("Sair da conta");
});

test('carrossel: os pets vêm primeiro e "Cadastre seu pet" fica no fim da fila', async ({ page }) => {
  const doisPets = {
    ...DADOS_ANA,
    pets: [
      { ...DADOS_ANA.pets[0], id: "pet-luna", nome: "Luna" },
      { ...DADOS_ANA.pets[0], id: "pet-thor", nome: "Thor" },
    ],
  };
  await usarSupabaseFalso(page, doisPets);
  await page.goto("/");

  const nomes = page.locator(".carrossel-lista .carrossel-nome");
  await expect(nomes).toHaveText(["Luna", "Thor", "Cadastre seu pet"]);
});

test("carrossel: pet sem foto mostra a imagem padrão da espécie", async ({ page }) => {
  // Luna é "Canino" e está com foto_url vazia
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/");

  await expect(page.getByRole("img", { name: "Luna" })).toHaveAttribute("src", "/especies/caes.png");
});

test("Meu perfil: o CPF aparece, mas não dá para mudar", async ({ page }) => {
  const comCpf = {
    ...DADOS_ANA,
    tutores: [{ ...DADOS_ANA.tutores[0], id: TUTORA.id, sobrenome: "Silva", cpf: "123.456.789-09" }],
  };
  await usarSupabaseFalso(page, comCpf);
  await page.goto("/meu-perfil");

  const cpf = page.getByRole("textbox", { name: "CPF" });
  await expect(cpf).toHaveValue("123.456.789-09");
  await expect(cpf).toBeDisabled();
});
