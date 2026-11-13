// Testes de src/cidadesSC.js: a lista das cidades de Santa Catarina.
// Rodar: npm test
import { describe, it, expect } from "vitest";
import { cidadesSC, coordenadasSC } from "./cidadesSC.js";

describe("cidadesSC", () => {
  it("tem as 295 cidades de SC", () => {
    expect(cidadesSC).toHaveLength(295);
  });

  it("começa em Abdon Batista", () => {
    expect(cidadesSC[0]).toBe("Abdon Batista");
  });

  it("tem Xanxerê e Balneário Camboriú", () => {
    expect(cidadesSC).toContain("Xanxerê");
    expect(cidadesSC).toContain("Balneário Camboriú");
  });

  it("não repete nenhuma cidade", () => {
    expect(new Set(cidadesSC).size).toBe(cidadesSC.length);
  });

  it("toda cidade tem coordenadas (latitude e longitude), e vice-versa", () => {
    expect(Object.keys(coordenadasSC).sort()).toEqual([...cidadesSC].sort());
  });

  it("as coordenadas ficam dentro de Santa Catarina (latitude -29,5 a -25,9; longitude -54 a -48)", () => {
    for (const [cidade, [lat, lng]] of Object.entries(coordenadasSC)) {
      expect(lat, cidade).toBeGreaterThan(-29.5);
      expect(lat, cidade).toBeLessThan(-25.9);
      expect(lng, cidade).toBeGreaterThan(-54);
      expect(lng, cidade).toBeLessThan(-48);
    }
  });
});
