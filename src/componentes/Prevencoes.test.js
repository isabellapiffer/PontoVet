// Testes das funções de src/componentes/Prevencoes.jsx
// (vermifugação, antiparasitário, vacinas e testes de FIV/FeLV).
// Rodar: npm test
import { describe, it, expect } from "vitest";
import {
  ordenarPorData,
  textoRegistro,
  registrosDaUltimaData,
  resumoPrevencao,
} from "./Prevencoes.jsx";

describe("ordenarPorData", () => {
  it("do mais novo para o mais antigo", () => {
    const registros = [
      { produto: "A", data: "2026-01-10" },
      { produto: "C", data: "2026-09-10" },
      { produto: "B", data: "2026-05-01" },
    ];
    expect(ordenarPorData(registros).map((r) => r.produto)).toEqual(["C", "B", "A"]);
  });

  it("não muda a lista original", () => {
    const registros = [
      { data: "2026-01-10" },
      { data: "2026-09-10" },
    ];
    ordenarPorData(registros);
    expect(registros[0].data).toBe("2026-01-10");
  });
});

describe("textoRegistro", () => {
  it("produto com dose: 'Drontal · 1 comprimido(s)'", () => {
    expect(textoRegistro({ produto: "Drontal", dose: "1", unidade: "comprimido(s)" })).toBe(
      "Drontal · 1 comprimido(s)"
    );
  });

  it("produto sem dose mostra só o nome", () => {
    expect(textoRegistro({ produto: "V10" })).toBe("V10");
  });

  it("teste de FIV/FeLV usa o resultado no lugar do produto", () => {
    expect(textoRegistro({ resultado: "Negativo", data: "2026-09-10" })).toBe("Negativo");
  });
});

describe("registrosDaUltimaData", () => {
  it("sem registros devolve lista vazia", () => {
    expect(registrosDaUltimaData([])).toEqual([]);
  });

  it("junta o que foi dado no mesmo dia (V10 e Raiva)", () => {
    const registros = [
      { produto: "V10", data: "2026-09-10" },
      { produto: "Raiva", data: "2026-09-10" },
      { produto: "V10", data: "2025-09-10" },
    ];
    expect(registrosDaUltimaData(registros).map((r) => r.produto)).toEqual(["V10", "Raiva"]);
  });
});

describe("resumoPrevencao (tópico fechado)", () => {
  it("sem registros: 'Nenhum registrado'", () => {
    expect(resumoPrevencao([])).toBe("Nenhum registrado");
  });

  it("'Última: Drontal · 10/09/2026'", () => {
    expect(resumoPrevencao([{ produto: "Drontal", data: "2026-09-10" }])).toBe(
      "Última: Drontal · 10/09/2026"
    );
  });

  it("várias vezes: mostra a mais recente", () => {
    const registros = [
      { produto: "Drontal", data: "2026-01-10" },
      { produto: "Milbemax", data: "2026-09-10" },
    ];
    expect(resumoPrevencao(registros)).toBe("Última: Milbemax · 10/09/2026");
  });

  it("vacinas no mesmo dia: 'Última: V10, Raiva · 10/09/2026'", () => {
    const registros = [
      { produto: "V10", data: "2026-09-10" },
      { produto: "Raiva", data: "2026-09-10" },
    ];
    expect(resumoPrevencao(registros)).toBe("Última: V10, Raiva · 10/09/2026");
  });

  it("teste de FIV: 'Última: Negativo · 10/09/2026'", () => {
    expect(resumoPrevencao([{ resultado: "Negativo", data: "2026-09-10" }])).toBe(
      "Última: Negativo · 10/09/2026"
    );
  });
});
