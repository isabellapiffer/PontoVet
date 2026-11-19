// Gaveta de um agendamento (consulta, exame, vacina agendada...): lápis para
// editar e lixeira para apagar (com confirmação). Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA, TUTORA } from "./supabaseFalso.js";

// Hoje no formato do banco: "2026-11-18"
function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const CONSULTA = {
  id: "comp-1",
  tutor_id: TUTORA.id,
  pet_id: "pet-luna",
  tipo: "consulta",
  titulo: "Consulta",
  data: hojeISO(),
  hora: "10:00",
  local: "Clínica Patas",
  observacao: null,
  preparo: null,
};

// Abre a Agenda com a consulta de hoje e abre a gaveta dela.
// Devolve os pedidos de alterar (PATCH) e apagar (DELETE) que o app fizer.
async function abrirConsulta(page) {
  await usarSupabaseFalso(page, { ...DADOS_ANA, compromissos: [CONSULTA] });
  const pedidos = { alterar: null, apagar: false };
  await page.route("http://supabase-falso.test/rest/v1/compromissos**", (route) => {
    const metodo = route.request().method();
    if (metodo === "GET") return route.fallback();
    if (metodo === "PATCH") pedidos.alterar = { url: route.request().url(), corpo: route.request().postDataJSON() };
    if (metodo === "DELETE") pedidos.apagar = true;
    // O app confere se uma linha foi alterada/apagada
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: CONSULTA.id }]) });
  });

  await page.goto("/agenda");
  await page.getByRole("button", { name: /Consulta · Luna/ }).first().click();
  await expect(page.getByRole("dialog", { name: "Consulta" })).toBeVisible();
  return pedidos;
}

test("lápis: edita o agendamento com os campos já preenchidos", async ({ page }) => {
  const pedidos = await abrirConsulta(page);

  await page.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByRole("heading", { name: "Editar agendamento" })).toBeVisible();

  const local = page.getByPlaceholder("Ex.: Dra. Ana, Clínica Patas");
  await expect(local).toHaveValue("Clínica Patas");
  await local.fill("Dra. Bia");
  await page.getByPlaceholder("Ex.: levar os exames anteriores").fill("levar a carteirinha");
  await page.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(page.getByRole("heading", { name: "Editar agendamento" })).toHaveCount(0);
  expect(pedidos.alterar.url).toContain("id=eq.comp-1");
  expect(pedidos.alterar.corpo).toMatchObject({
    data: CONSULTA.data,
    hora: "10:00",
    local: "Dra. Bia",
    observacao: "levar a carteirinha",
  });
});

test("apagar agendamento (dentro do lápis): pede confirmação; cancelar não apaga, aceitar apaga", async ({ page }) => {
  const pedidos = await abrirConsulta(page);
  await page.getByRole("button", { name: "Editar" }).click();

  let frase = "";
  page.once("dialog", (janela) => {
    frase = janela.message();
    janela.dismiss();
  });
  await page.getByRole("button", { name: "Apagar agendamento" }).click();
  expect(frase).toBe("Excluir este item da agenda?");
  await page.waitForTimeout(300);
  expect(pedidos.apagar).toBe(false);

  page.once("dialog", (janela) => janela.accept());
  await page.getByRole("button", { name: "Apagar agendamento" }).click();
  await expect(page.getByRole("heading", { name: "Editar agendamento" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Consulta" })).toHaveCount(0);
  expect(pedidos.apagar).toBe(true);
});

// ---------- Lembrete de vermífugo (vem do histórico do pet) ----------

// Data de hoje mais N dias, no formato do banco
function diasDepois(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const naTela = (iso) => iso.split("-").reverse().join("/");

// Vetmax dado há 5 dias, "Repetir em 21 dias": próxima dose daqui a 16 dias
const VETMAX = { produto: "Vetmax", dose: "1", unidade: "comprimido", data: diasDepois(-5), proxima: diasDepois(16), autor: "tutor" };

async function abrirVermifugo(page) {
  const luna = { ...DADOS_ANA.pets[0], vermifugacoes: [VETMAX] };
  await usarSupabaseFalso(page, { ...DADOS_ANA, pets: [luna] });
  const enviado = { corpo: null };
  await page.route("http://supabase-falso.test/rest/v1/pets**", (route) => {
    if (route.request().method() !== "PATCH") return route.fallback();
    enviado.corpo = route.request().postDataJSON();
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: luna.id }]) });
  });

  await page.goto("/agenda");
  await page.getByRole("button", { name: /Vermífugo Vetmax · Luna/ }).first().click();
  await page.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByRole("heading", { name: "Editar vermífugo" })).toBeVisible();
  return enviado;
}

test("lembrete de vermífugo: o lápis abre o formulário preenchido e salva a alteração", async ({ page }) => {
  const enviado = await abrirVermifugo(page);

  // Preenchido com o que foi registrado (o "21 dias" marcado mostra a próxima dose)
  await expect(page.getByPlaceholder("Ex: Drontal")).toHaveValue("Vetmax");
  await expect(page.getByLabel("Dose")).toHaveValue("1");
  await expect(page.getByText(`Próxima dose: ${naTela(VETMAX.proxima)}`)).toBeVisible();

  await page.getByRole("button", { name: "15 dias" }).click();
  await expect(page.getByText(`Próxima dose: ${naTela(diasDepois(10))}`)).toBeVisible();
  await page.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(page.getByRole("heading", { name: "Editar vermífugo" })).toHaveCount(0);
  expect(enviado.corpo.vermifugacoes).toEqual([{ ...VETMAX, proxima: diasDepois(10) }]);
});

test("lembrete de vermífugo: Apagar lembrete tira só a próxima dose (o registro fica)", async ({ page }) => {
  const enviado = await abrirVermifugo(page);

  let frase = "";
  page.once("dialog", (janela) => {
    frase = janela.message();
    janela.accept();
  });
  await page.getByRole("button", { name: "Apagar lembrete" }).click();

  await expect(page.getByRole("heading", { name: "Editar vermífugo" })).toHaveCount(0);
  expect(frase).toBe("Apagar este lembrete? O registro continua no histórico do pet.");
  expect(enviado.corpo.vermifugacoes).toEqual([{ ...VETMAX, proxima: null }]);
});
