// Testes de src/dadosPets.js: espécies, raças e imagens padrão do cadastro do pet.
// Rodar: npm test
import { describe, it, expect } from "vitest";
import { especies, racasPorEspecie, imagemPadraoPorEspecie } from "./dadosPets.js";

describe("espécies", () => {
  it("são 6, com Canino e Felino primeiro", () => {
    expect(especies).toHaveLength(6);
    expect(especies.slice(0, 2)).toEqual(["Canino", "Felino"]);
  });

  it("toda espécie tem uma imagem padrão (para pet sem foto)", () => {
    for (const especie of especies) {
      expect(imagemPadraoPorEspecie[especie], especie).toMatch(/^\/especies\/.+\.png$/);
    }
  });

  it("toda espécie tem uma lista de raças", () => {
    for (const especie of especies) {
      expect(racasPorEspecie[especie].length, especie).toBeGreaterThan(0);
    }
  });
});

describe("raças", () => {
  it("cães e gatos têm Vira-lata (SRD)", () => {
    expect(racasPorEspecie.Canino).toContain("Vira-lata (SRD)");
    expect(racasPorEspecie.Felino).toContain("Vira-lata (SRD)");
  });

  it("hamster está em Silvestres e exóticos", () => {
    expect(racasPorEspecie["Silvestres e exóticos"]).toContain("Hamster");
  });

  it("não repete raça dentro da mesma espécie", () => {
    for (const [especie, racas] of Object.entries(racasPorEspecie)) {
      expect(new Set(racas).size, especie).toBe(racas.length);
    }
  });
});
