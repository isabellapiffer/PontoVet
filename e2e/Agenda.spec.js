// Agenda: botão "+" (adicionar na agenda).
// Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA } from "./supabaseFalso.js";

// Data no formato da tela: "16/11/2026"
function naTela(data) {
  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${data.getFullYear()}`;
}

test('sem nenhum pet cadastrado, o botão "+" não aparece', async ({ page }) => {
  await usarSupabaseFalso(page, { ...DADOS_ANA, pets: [] });
  await page.goto("/agenda");

  // Espera terminar de carregar (o "+" só pode aparecer depois disso)
  await expect(page.getByText("Nada marcado para este dia.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Adicionar na agenda" })).toHaveCount(0);
});

test('com pet, o "+" aparece; a data já vem com o dia escolhido e "Data atual" preenche hoje', async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/agenda");

  // Escolhe um dia que NÃO é hoje: avança uma semana
  await page.getByRole("button", { name: "Próxima semana" }).click();
  await page.getByRole("button", { name: "Adicionar na agenda" }).click();
  await page.getByRole("button", { name: "Consulta" }).click();

  const daquiAUmaSemana = new Date();
  daquiAUmaSemana.setDate(daquiAUmaSemana.getDate() + 7);
  const campoData = page.getByPlaceholder("DD/MM/AAAA");
  await expect(campoData).toHaveValue(naTela(daquiAUmaSemana));

  await page.getByRole("button", { name: "Data atual" }).click();
  await expect(campoData).toHaveValue(naTela(new Date()));
});

test('Outros: "O que gostaria de agendar?", Data, Hora, Local e Observação', async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Adicionar na agenda" }).click();
  await page.getByRole("button", { name: "Outros" }).click();

  await expect(page.getByText("O que é?")).toHaveCount(0);
  for (const rotulo of ["O que gostaria de agendar?", "Data", "Hora", "Local", "Observação"]) {
    await expect(page.locator(".add-rotulo", { hasText: new RegExp(`^${rotulo.replace("?", "\\?")}`) })).toBeVisible();
  }

  // Salvar vazio: o aviso usa a frase nova
  await page.getByRole("button", { name: "Salvar na agenda" }).click();
  await expect(page.getByText("Preencha o que gostaria de agendar.")).toBeVisible();
});

// Remédio > Medicamento: abre a tela com a Luna, que já tem Dermatite em tratamento.
// Devolve uma função que espera o pedido de salvar no pet e devolve o que foi enviado
async function abrirMedicamento(page) {
  const luna = { ...DADOS_ANA.pets[0], doencas_em_tratamento: [{ doenca: "Dermatite" }] };
  await usarSupabaseFalso(page, { ...DADOS_ANA, pets: [luna] });
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Adicionar na agenda" }).click();
  await page.getByRole("button", { name: "Remédio" }).click();
  await page.getByRole("button", { name: "Medicamento" }).click();

  return async () => {
    const pedido = await page.waitForRequest(
      (r) => r.url().includes("/rest/v1/pets") && r.method() === "PATCH"
    );
    return pedido.postDataJSON();
  };
}

test("Medicamento: sem a pergunta de doença; Diagnóstico e o nome da medicação já aparecem", async ({ page }) => {
  await abrirMedicamento(page);

  await expect(page.getByText("É para uma doença em tratamento?")).toHaveCount(0);
  await expect(page.getByLabel("Diagnóstico")).toBeVisible();
  await expect(page.getByPlaceholder("Ex: Apoquel")).toBeVisible();

  // Tocar na doença que o pet já tem escreve o nome no campo
  await page.getByRole("button", { name: "Dermatite" }).click();
  await expect(page.getByLabel("Diagnóstico")).toHaveValue("Dermatite");
});

test("Medicamento com Diagnóstico: vai para a doença em tratamento", async ({ page }) => {
  const enviado = await abrirMedicamento(page);
  await page.getByLabel("Diagnóstico").fill("Otite");
  await page.getByPlaceholder("Ex: Apoquel").fill("Otomax");
  await page.getByRole("button", { name: "Salvar no histórico" }).click();

  const corpo = await enviado();
  expect(corpo.medicacoes).toEqual([expect.objectContaining({ nome: "Otomax", doenca: "Otite" })]);
  expect(corpo.doencas_em_tratamento.map((d) => d.doenca)).toEqual(["Dermatite", "Otite"]);
});

test("Medicamento sem Diagnóstico: vai para Outros medicamentos", async ({ page }) => {
  const enviado = await abrirMedicamento(page);
  await page.getByPlaceholder("Ex: Apoquel").fill("Meloxicam");
  await page.getByRole("button", { name: "Salvar no histórico" }).click();

  const corpo = await enviado();
  expect(corpo.outros_medicamentos).toEqual([expect.objectContaining({ nome: "Meloxicam" })]);
  expect(corpo.medicacoes).toBeUndefined();
});
