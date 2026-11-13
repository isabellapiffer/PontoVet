// Testes das funções de src/componentes/FormularioPet.jsx.
// Rodar: npm test
import { describe, it, expect, vi } from "vitest";

// O formulário importa o Supabase. Aqui ele é FALSO: nenhum pedido sai de verdade.
vi.mock("../supabaseClient.js", () => ({ supabase: {} }));

import { textoCastrado, errosDosDados } from "./FormularioPet.jsx";

// Avisos embaixo de cada campo dos Dados do animal.
// "Hoje" fica fixo em 09/11/2026 para o teste não mudar com o dia.
describe("errosDosDados", () => {
  const HOJE = "2026-11-09";
  const vazio = { naoSeiData: false, dataNascimento: "", idadeAnos: "", idadeMeses: "", peso: "" };

  function data(dataNascimento, tentouSalvar = false) {
    return errosDosDados({ ...vazio, dataNascimento }, tentouSalvar, HOJE).data;
  }

  it("nascimento depois de hoje (22/12/2026) avisa assim que a data fica completa", () => {
    expect(data("22/12/2026")).toBe("A data de nascimento não pode ser depois de hoje.");
    expect(data("10/11/2026")).toBe("A data de nascimento não pode ser depois de hoje.");
  });

  it("hoje e antes de hoje não avisam", () => {
    expect(data("09/11/2026")).toBe("");
    expect(data("15/08/2020")).toBe("");
  });

  it("data pela metade: só avisa depois de tentar salvar", () => {
    expect(data("22/12")).toBe("");
    expect(data("22/12", true)).toBe("Data inválida: preencha a data completa (dd/mm/aaaa).");
  });

  it("data vazia: só avisa depois de tentar salvar", () => {
    expect(data("")).toBe("");
    expect(data("", true)).toBe("Informe a data de nascimento ou marque que não sabe.");
  });

  it("dia que não existe e ano antes de 1900", () => {
    expect(data("31/02/2020")).toBe("Data inválida: fevereiro de 2020 não tem dia 31.");
    expect(data("01/01/1899")).toBe("Data inválida: o ano precisa ser 1900 ou depois.");
  });

  it("01/01/1900 é aceita (o limite é 1900)", () => {
    expect(data("01/01/1900")).toBe("");
  });

  it("11 meses não avisa (os meses vão até 11)", () => {
    const pet = { ...vazio, naoSeiData: true, idadeAnos: "1", idadeMeses: "11" };
    expect(errosDosDados(pet, true, HOJE).idade).toBe("");
  });

  it("'Não sei a data exata' marcado: não confere a data, confere a idade", () => {
    const erros = errosDosDados(
      { ...vazio, naoSeiData: true, dataNascimento: "22/12/2026", idadeMeses: "14" },
      false,
      HOJE
    );
    expect(erros.data).toBe("");
    expect(erros.idade).toBe("Os meses vão de 0 a 11. Ex.: 14 meses = 1 ano e 2 meses.");
  });

  it("idade 0 anos e 0 meses: só avisa depois de tentar salvar", () => {
    const pet = { ...vazio, naoSeiData: true };
    expect(errosDosDados(pet, false, HOJE).idade).toBe("");
    expect(errosDosDados(pet, true, HOJE).idade).toBe("Informe a idade aproximada.");
  });

  it("peso inválido avisa depois de tentar salvar; peso vazio pode", () => {
    expect(errosDosDados({ ...vazio, peso: "0" }, true, HOJE).peso).toBe("Peso inválido. Ex: 4,2");
    expect(errosDosDados({ ...vazio, peso: "abc" }, true, HOJE).peso).toBe("Peso inválido. Ex: 4,2");
    expect(errosDosDados({ ...vazio, peso: "4,2" }, true, HOJE).peso).toBe("");
    expect(errosDosDados(vazio, true, HOJE).peso).toBe("");
  });
});

describe("textoCastrado", () => {
  it("true vira 'Sim'", () => {
    expect(textoCastrado(true)).toBe("Sim");
  });

  it("false vira 'Não'", () => {
    expect(textoCastrado(false)).toBe("Não");
  });

  it("vazio (null ou undefined) vira 'Não definido'", () => {
    expect(textoCastrado(null)).toBe("Não definido");
    expect(textoCastrado(undefined)).toBe("Não definido");
  });
});
