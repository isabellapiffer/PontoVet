import { describe, it, expect } from "vitest";
import {
  nomeDaVacina,
  VACINAS_POR_ESPECIE,
  VACINAS_OUTRAS_ESPECIES,
} from "./vacinas.js";

describe("nomeDaVacina", () => {
  it("tira o '(polivalente)' da V10", () => {
    expect(nomeDaVacina("V10 (polivalente)")).toBe("V10");
  });

  it("tira o '(polivalente)' da V8", () => {
    expect(nomeDaVacina("V8 (polivalente)")).toBe("V8");
  });

  it("não mexe em vacina sem '(polivalente)' (Raiva continua Raiva)", () => {
    expect(nomeDaVacina("Raiva")).toBe("Raiva");
  });

  it("funciona com todas as vacinas de cães e gatos da lista", () => {
    const todas = [...VACINAS_POR_ESPECIE.Canino, ...VACINAS_POR_ESPECIE.Felino];
    for (const opcao of todas) {
      expect(nomeDaVacina(opcao)).not.toContain("polivalente");
    }
  });
});

describe("listas de vacinas", () => {
  it("cães (Canino) têm V10 e Raiva", () => {
    expect(VACINAS_POR_ESPECIE.Canino).toContain("V10 (polivalente)");
    expect(VACINAS_POR_ESPECIE.Canino).toContain("Raiva");
  });

  it("gatos (Felino) têm FeLV e Raiva", () => {
    expect(VACINAS_POR_ESPECIE.Felino).toContain("FeLV");
    expect(VACINAS_POR_ESPECIE.Felino).toContain("Raiva");
  });

  it("outras espécies só têm a Raiva", () => {
    expect(VACINAS_OUTRAS_ESPECIES).toEqual(["Raiva"]);
  });
});
