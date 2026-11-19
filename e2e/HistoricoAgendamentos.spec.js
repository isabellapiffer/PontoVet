// Agenda: "Histórico de agendamentos" logo abaixo dos "Próximos", com os
// agendamentos cuja data já passou. Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, DADOS_ANA, TUTORA } from "./supabaseFalso.js";

function diasDepois(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const compromisso = (id, titulo, data) => ({
  id,
  tutor_id: TUTORA.id,
  pet_id: "pet-luna",
  tipo: "consulta",
  titulo,
  data,
  hora: null,
  local: null,
  observacao: null,
  preparo: null,
});

test("o que já passou vai para o Histórico, abaixo dos Próximos", async ({ page }) => {
  await usarSupabaseFalso(page, {
    ...DADOS_ANA,
    compromissos: [
      compromisso("c1", "Consulta antiga", diasDepois(-30)),
      compromisso("c2", "Consulta da semana passada", diasDepois(-7)),
      compromisso("c3", "Consulta futura", diasDepois(5)),
    ],
  });
  await page.goto("/agenda");

  const proximos = page.locator("section", { has: page.getByRole("heading", { name: "Próximos agendamentos" }) });
  const historico = page.locator("section", { has: page.getByRole("heading", { name: "Histórico de agendamentos" }) });

  await expect(proximos.getByText("Consulta futura")).toBeVisible();
  await expect(proximos.getByText("Consulta antiga")).toHaveCount(0);

  // Mais recente primeiro
  await expect(historico.locator(".agenda-item-titulo")).toHaveText([
    /Consulta da semana passada/,
    /Consulta antiga/,
  ]);

  // O Histórico fica depois dos Próximos
  const yProximos = (await proximos.boundingBox()).y;
  const yHistorico = (await historico.boundingBox()).y;
  expect(yHistorico).toBeGreaterThan(yProximos);
});

test("sem nada no passado, o Histórico não aparece", async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA);
  await page.goto("/agenda");
  await expect(page.getByRole("heading", { name: "Próximos agendamentos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Histórico de agendamentos" })).toHaveCount(0);
});
