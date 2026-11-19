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

// Medicamentos > Medicamento: abre a tela com a Luna, que já tem Dermatite em tratamento.
// Devolve uma função que espera o pedido de salvar no pet e devolve o que foi enviado
async function abrirMedicamento(page) {
  const luna = { ...DADOS_ANA.pets[0], doencas_em_tratamento: [{ doenca: "Dermatite" }] };
  await usarSupabaseFalso(page, { ...DADOS_ANA, pets: [luna] });
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Adicionar na agenda" }).click();
  await page.getByRole("button", { name: "Medicamentos" }).click();
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

// Medicamentos > Vermífugo > Registrar: preenche o produto e a data, e marca "Outro" no "Repetir em".
// Devolve uma função que espera o pedido de salvar no pet e devolve o que foi enviado
async function abrirVermifugoComOutro(page) {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Adicionar na agenda" }).click();
  await page.getByRole("button", { name: "Medicamentos" }).click();
  await expect(page.getByRole("heading", { name: "Novo medicamento" })).toBeVisible();
  await expect(page.getByText("Que tipo de medicamento?")).toBeVisible();
  await page.getByRole("button", { name: "Vermífugo" }).click();
  await page.getByPlaceholder("Ex: Drontal").fill("Drontal");
  await page.getByPlaceholder("DD/MM/AAAA").fill("10/11/2026");

  // O campo da quantidade só aparece depois de tocar em "Outro"
  await expect(page.getByLabel("Quantidade")).toHaveCount(0);
  await page.getByRole("button", { name: "Outro", exact: true }).click();

  return async () => {
    const pedido = await page.waitForRequest(
      (r) => r.url().includes("/rest/v1/pets") && r.method() === "PATCH"
    );
    return pedido.postDataJSON();
  };
}

test('Repetir em "Outro": 45 dias depois de 10/11/2026 dá 25/12/2026', async ({ page }) => {
  const enviado = await abrirVermifugoComOutro(page);

  // Só números, e no máximo 2: "4a5b9" vira "45"
  await page.getByLabel("Quantidade").pressSequentially("4a5b9");
  await expect(page.getByLabel("Quantidade")).toHaveValue("45");
  await expect(page.getByText("Próxima dose: 25/12/2026")).toBeVisible();

  await page.getByRole("button", { name: "Salvar no histórico" }).click();
  const corpo = await enviado();
  expect(corpo.vermifugacoes).toEqual([
    expect.objectContaining({ produto: "Drontal", data: "2026-11-10", proxima: "2026-12-25" }),
  ]);
});

test('Repetir em "Outro": trocar para meses, 2 meses depois de 10/11/2026 dá 10/01/2027', async ({ page }) => {
  const enviado = await abrirVermifugoComOutro(page);

  await page.getByLabel("Quantidade").fill("2");
  // A lista do tempo é a última da tela (a primeira é a unidade da dose)
  await page.locator(".lista-opcoes input").last().click();
  await page.getByText("meses", { exact: true }).click();
  await expect(page.getByText("Próxima dose: 10/01/2027")).toBeVisible();

  await page.getByRole("button", { name: "Salvar no histórico" }).click();
  const corpo = await enviado();
  expect(corpo.vermifugacoes).toEqual([expect.objectContaining({ proxima: "2027-01-10" })]);
});

test('Repetir em "Outro" vazio: pede confirmação; cancelar não salva, aceitar salva sem próxima dose', async ({ page }) => {
  const enviado = await abrirVermifugoComOutro(page);
  let salvou = false;
  page.on("request", (r) => {
    if (r.url().includes("/rest/v1/pets") && r.method() === "PATCH") salvou = true;
  });

  // Cancelar: a frase aparece e nada é enviado ao banco
  let frase = "";
  page.once("dialog", (janela) => {
    frase = janela.message();
    janela.dismiss();
  });
  await page.getByRole("button", { name: "Salvar no histórico" }).click();
  expect(frase).toContain("a próxima dose não vai aparecer na sua agenda");
  await page.waitForTimeout(500);
  expect(salvou).toBe(false);

  // Aceitar: salva sem próxima dose
  page.once("dialog", (janela) => janela.accept());
  await page.getByRole("button", { name: "Salvar no histórico" }).click();
  const corpo = await enviado();
  expect(corpo.vermifugacoes).toEqual([expect.objectContaining({ produto: "Drontal", proxima: null })]);
});
