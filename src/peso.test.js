// Testes de src/peso.js: casos que ainda não tinham teste.
// (Os principais estão em testes/peso.test.js)
// Rodar: npm test
import { describe, it, expect, vi, afterEach } from "vitest";

// O peso.js usa o lembretes.js, que importa o Supabase. Aqui ele é FALSO.
vi.mock("./supabaseClient.js", () => ({ supabase: {} }));

import { pesoDigitado, textoPeso, ultimoPeso, pesosParaSalvar, UNIDADES_PESO } from "./peso.js";

afterEach(() => vi.useRealTimers());

describe("pesoDigitado", () => {
  it("só ',' ou só '.' é peso inválido", () => {
    expect(pesoDigitado(",")).toBe(null);
    expect(pesoDigitado(".")).toBe(null);
  });

  it("aceita 350 (hamster em gramas)", () => {
    expect(pesoDigitado("350")).toBe(350);
  });

  it("aceita ponto também", () => {
    expect(pesoDigitado("4.2")).toBe(4.2);
  });
});

describe("textoPeso", () => {
  it("350 g (hamster)", () => {
    expect(textoPeso([{ peso: 350, unidade: "g", data: "2026-10-24" }])).toBe("350 g");
  });

  it("sem pesos (undefined) mostra 'Não informado'", () => {
    expect(textoPeso(undefined)).toBe("Não informado");
  });
});

describe("pesos guardados", () => {
  it("as unidades são kg e g", () => {
    expect(UNIDADES_PESO).toEqual(["kg", "g"]);
  });

  it("ultimoPeso de lista vazia é null", () => {
    expect(ultimoPeso([])).toBe(null);
    expect(ultimoPeso(undefined)).toBe(null);
  });

  it("peso novo no mesmo dia troca o de hoje (não cria dois no mesmo dia)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 27));
    const antigos = [{ peso: 4, unidade: "kg", data: "2026-10-27", autor: "tutor" }];
    const novos = pesosParaSalvar(antigos, 4.5, "kg");
    expect(novos).toHaveLength(1);
    expect(novos[0].peso).toBe(4.5);
  });

  it("mudar só a unidade (4 kg para 4 g) conta como peso novo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 27));
    const antigos = [{ peso: 4, unidade: "kg", data: "2026-01-10" }];
    expect(pesosParaSalvar(antigos, 4, "g")).toHaveLength(2);
  });

  it("peso novo é marcado como informado pelo tutor", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 27));
    const novos = pesosParaSalvar([], 4.2, "kg");
    expect(novos).toEqual([{ peso: 4.2, unidade: "kg", data: "2026-10-27", autor: "tutor" }]);
  });
});
