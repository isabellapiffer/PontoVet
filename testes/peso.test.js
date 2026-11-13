// Testes automáticos do peso do pet. Rodar: npm test
import { describe, it, expect, vi, afterEach } from "vitest";
import { pesoDigitado, textoPeso, ultimoPeso, pesosParaSalvar } from "../src/peso.js";

afterEach(() => vi.useRealTimers());

describe("Peso do pet", () => {
  it("aceita vírgula", () => {
    expect(pesoDigitado("4,2")).toBe(4.2);
  });

  it("recusa vazio e zero", () => {
    expect(pesoDigitado("")).toBe(null);
    expect(pesoDigitado("0")).toBe(null);
  });

  it("mostra o peso mais recente", () => {
    const pesos = [
      { peso: 4, unidade: "kg", data: "2026-01-10" },
      { peso: 4.2, unidade: "kg", data: "2026-10-24" },
    ];
    expect(ultimoPeso(pesos).peso).toBe(4.2);
    expect(textoPeso(pesos)).toBe("4,2 kg");
    expect(textoPeso([])).toBe("Não informado");
  });

  it("peso novo entra no histórico, sem apagar os antigos", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 27)); // 27/10/2026
    const antigos = [{ peso: 4, unidade: "kg", data: "2026-01-10", autor: "tutor" }];
    const novos = pesosParaSalvar(antigos, 4.5, "kg");
    expect(novos).toHaveLength(2);
    expect(novos[1]).toMatchObject({ peso: 4.5, data: "2026-10-27" });
  });

  it("mesmo peso de antes não cria registro repetido", () => {
    const antigos = [{ peso: 4, unidade: "kg", data: "2026-01-10" }];
    expect(pesosParaSalvar(antigos, 4, "kg")).toBe(antigos);
  });
});
