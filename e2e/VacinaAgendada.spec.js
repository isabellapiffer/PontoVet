// Vacinas na Agenda: agendar várias juntas (V10 OU V8; Gripes, Raiva e Giardiavax
// com qualquer uma) e, no agendamento, "Registrar aplicação", que leva as vacinas
// para o histórico do pet com a próxima aplicação. Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA, TUTORA } from "./supabaseFalso.js";

function diasDepois(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test("agendar: marca várias vacinas; V10 e V8 não ficam juntas", async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  const salvar = page.waitForRequest(
    (pedido) => pedido.url().includes("/rest/v1/compromissos") && pedido.method() === "POST"
  );

  await page.goto("/agenda");
  await page.getByRole("button", { name: "Adicionar na agenda" }).click();
  await page.getByRole("button", { name: "Vacina" }).click();
  await page.getByRole("button", { name: "Agendar aplicação" }).click();

  const v10 = page.getByRole("button", { name: "V10 (polivalente)" });
  const v8 = page.getByRole("button", { name: "V8 (polivalente)" });
  await v10.click();
  await page.getByRole("button", { name: "Raiva" }).click();
  await page.getByRole("button", { name: "Gripes" }).click();
  await expect(v10).toHaveAttribute("aria-pressed", "true");

  // Marcar a V8 desmarca a V10; Raiva e Gripes continuam
  await v8.click();
  await expect(v8).toHaveAttribute("aria-pressed", "true");
  await expect(v10).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Raiva" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Salvar na agenda" }).click();
  expect((await salvar).postDataJSON()).toMatchObject({ tipo: "vacina", titulo: "Vacina Raiva + Gripes + V8" });
});

for (const tipo of ["Vacina", "Consulta"]) {
  test(`agendar ${tipo.toLowerCase()} no passado: avisa e não salva`, async ({ page }) => {
    await usarSupabaseFalso(page, DADOS_ANA);
    let salvou = false;
    page.on("request", (pedido) => {
      if (pedido.url().includes("/rest/v1/compromissos") && pedido.method() === "POST") salvou = true;
    });

    await page.goto("/agenda");
    await page.getByRole("button", { name: "Adicionar na agenda" }).click();
    await page.getByRole("button", { name: tipo }).click();
    if (tipo === "Vacina") {
      await page.getByRole("button", { name: "Agendar aplicação" }).click();
      await page.getByRole("button", { name: "Raiva" }).click();
    }

    const ontem = diasDepois(-1).split("-").reverse().join("");
    await page.getByPlaceholder("DD/MM/AAAA").fill(ontem);
    await page.getByRole("button", { name: "Salvar na agenda" }).click();

    await expect(page.getByText("A data do agendamento não pode ser no passado.")).toBeVisible();
    expect(salvou).toBe(false);
  });
}

test("registrar aplicação a partir do agendamento: vai para o histórico com a próxima aplicação", async ({ page }) => {
  const agendada = {
    id: "comp-vac",
    tutor_id: TUTORA.id,
    pet_id: "pet-luna",
    tipo: "vacina",
    titulo: "Vacina V10 + Raiva",
    data: diasDepois(0),
    hora: null,
    local: null,
    observacao: null,
    preparo: null,
  };
  await usarSupabaseFalso(page, { ...DADOS_ANA, compromissos: [agendada] });
  const enviado = { vacinas: null, apagou: false };
  await page.route("http://supabase-falso.test/rest/v1/**", (route) => {
    const pedido = route.request();
    if (pedido.method() === "GET") return route.fallback();
    if (pedido.url().includes("/pets") && pedido.method() === "PATCH") enviado.vacinas = pedido.postDataJSON().vacinas;
    if (pedido.url().includes("/compromissos") && pedido.method() === "DELETE") enviado.apagou = true;
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "ok" }]) });
  });

  await page.goto("/agenda");
  await page.getByRole("button", { name: /Vacina V10 \+ Raiva · Luna/ }).first().click();
  await page.getByRole("button", { name: "Registrar aplicação" }).click();
  await expect(page.getByRole("heading", { name: "Registrar aplicação" })).toBeVisible();

  // As vacinas do agendamento já vêm marcadas, com a data do agendamento
  const blocos = page.locator(".vacinas-bloco");
  await expect(blocos).toHaveCount(2);
  await blocos.filter({ hasText: "V10" }).getByRole("button", { name: "21 dias" }).click();
  await blocos.filter({ hasText: "Raiva" }).getByRole("button", { name: "1 ano" }).click();
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Registrar aplicação" })).toHaveCount(0);
  const hoje = diasDepois(0);
  const umAno = `${Number(hoje.slice(0, 4)) + 1}${hoje.slice(4)}`;
  expect(enviado.vacinas).toEqual([
    { produto: "V10", data: hoje, proxima: diasDepois(21), autor: "tutor" },
    { produto: "Raiva", data: hoje, proxima: umAno, autor: "tutor" },
  ]);
  // O agendamento sai da agenda (agora é histórico + lembrete da próxima)
  expect(enviado.apagou).toBe(true);
});
