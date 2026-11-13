// Testes automáticos das funções de formatar e conferir datas.
// Rodar: npm test
import { describe, it, expect } from "vitest";
import {
  formatarData,
  validarData,
  paraDataISO,
  deDataISO,
  formatarMesAno,
  validarMesAno,
  paraMesISO,
  deMesISO,
} from "../src/formatadores.js";

describe("Data do diagnóstico (mês e ano)", () => {
  it("082026 vira 08/2026", () => {
    expect(formatarMesAno("082026")).toBe("08/2026");
  });

  it("digitar só 8 vira 08 (completa com zero)", () => {
    expect(formatarMesAno("8")).toBe("08");
    expect(formatarMesAno("82026")).toBe("08/2026");
  });

  it("10, 11 e 12 continuam funcionando", () => {
    expect(formatarMesAno("102026")).toBe("10/2026");
    expect(formatarMesAno("122026")).toBe("12/2026");
  });

  it("não deixa mês 13", () => {
    expect(formatarMesAno("13")).toBe("1");
  });

  it("confere mês e ano", () => {
    expect(validarMesAno("08/2026")).toBe("");
    expect(validarMesAno("08/20")).toContain("preencha o mês e o ano");
    expect(validarMesAno("00/2026")).toContain("mês 00");
    expect(validarMesAno("08/1980")).toContain("1990");
  });

  it("vai e volta do banco", () => {
    expect(paraMesISO("08/2026")).toBe("2026-08");
    expect(deMesISO("2026-08")).toBe("08/2026");
  });

  it("valor estranho do banco não vira 'undefined'", () => {
    expect(deMesISO(undefined)).toBe("");
    expect(deMesISO("2026")).toBe("");
  });
});

describe("Data completa (dd/mm/aaaa)", () => {
  it("formata enquanto digita", () => {
    expect(formatarData("10092026")).toBe("10/09/2026");
  });

  it("confere dia que não existe", () => {
    expect(validarData("31/02/2026")).toContain("fevereiro");
    expect(validarData("10/09/2026")).toBe("");
  });

  it("vai e volta do banco", () => {
    expect(paraDataISO("10/09/2026")).toBe("2026-09-10");
    expect(deDataISO("2026-09-10")).toBe("10/09/2026");
  });
});
