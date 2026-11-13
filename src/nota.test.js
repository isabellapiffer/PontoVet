import { describe, it, expect } from "vitest";
import { formatarNota } from "./nota.js";

describe("formatarNota", () => {
  // Veterinário sem avaliação (Juliana e Pedro): o quadradinho lilás mostra "Novo"
  it("sem nota (null) mostra 'Novo'", () => {
    expect(formatarNota(null)).toBe("Novo");
  });

  // Casos normais: a nota de um veterinário ou de uma avaliação
  it("troca o ponto por vírgula (4.9 vira 4,9)", () => {
    expect(formatarNota(4.9)).toBe("4,9");
  });

  it("mostra sempre uma casa depois da vírgula (4 vira 4,0)", () => {
    expect(formatarNota(4)).toBe("4,0");
  });

  it("arredonda para uma casa (4.46 vira 4,5)", () => {
    expect(formatarNota(4.46)).toBe("4,5");
  });

  // Limites da escala
  it("mostra a nota máxima como 5,0", () => {
    expect(formatarNota(5)).toBe("5,0");
  });

  it("mostra a nota mínima de 1 como 1,0", () => {
    expect(formatarNota(1)).toBe("1,0");
  });

  it("arredonda 4.96 para 5,0", () => {
    expect(formatarNota(4.96)).toBe("5,0");
  });

  // Sem nota: veterinário novo, ainda sem avaliações
  it('mostra "Novo" quando a nota é null', () => {
    expect(formatarNota(null)).toBe("Novo");
  });

  it('mostra "Novo" quando a nota não existe (undefined)', () => {
    expect(formatarNota(undefined)).toBe("Novo");
  });

  it('mostra "Novo" quando a nota é 0', () => {
    expect(formatarNota(0)).toBe("Novo");
  });

  it('mostra "Novo" quando a nota é NaN (conta que deu errado)', () => {
    expect(formatarNota(NaN)).toBe("Novo");
  });

  it("não deixa sobrar ponto no resultado", () => {
    expect(formatarNota(3.7)).not.toContain(".");
  });
});
