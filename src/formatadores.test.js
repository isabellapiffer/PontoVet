// Testes das funções de src/formatadores.js que ainda não tinham teste.
// (Os de data do diagnóstico e dd/mm/aaaa básicos já estão em testes/formatadores.test.js)
// Rodar: npm test
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  requisitosSenha,
  validarSenha,
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarCep,
  formatarData,
  validarData,
  paraDataISO,
  campoVazio,
  camposVazios,
  dataEstimada,
  idadeEmAnosEMeses,
  textoIdade,
} from "./formatadores.js";

// Nos testes de idade, "hoje" é sempre 05/11/2026, para o resultado não mudar com o tempo
function hojeE(ano, mes, dia) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(ano, mes - 1, dia));
}

afterEach(() => vi.useRealTimers());

describe("Datas inválidas (tabela do TESTES.md, 16/10/2026)", () => {
  it("31/02/2021: fevereiro de 2021 não tem dia 31", () => {
    expect(validarData("31/02/2021")).toBe("Data inválida: fevereiro de 2021 não tem dia 31.");
  });

  it("29/02/2021: 2021 não é bissexto", () => {
    expect(validarData("29/02/2021")).toBe("Data inválida: fevereiro de 2021 não tem dia 29.");
  });

  it("31/04/2021: abril de 2021 não tem dia 31", () => {
    expect(validarData("31/04/2021")).toBe("Data inválida: abril de 2021 não tem dia 31.");
  });

  it("00/05/2021: o dia 00 não existe", () => {
    expect(validarData("00/05/2021")).toBe("Data inválida: o dia 00 não existe.");
  });

  it("10/00/2021: o mês 00 não existe", () => {
    expect(validarData("10/00/2021")).toBe("Data inválida: o mês 00 não existe.");
  });

  it("10/13/2021: o mês 13 não existe", () => {
    expect(validarData("10/13/2021")).toBe("Data inválida: o mês 13 não existe.");
  });

  it("12/05/20: ano incompleto pede a data completa", () => {
    expect(validarData("12/05/20")).toBe(
      "Data inválida: preencha a data completa (dd/mm/aaaa)."
    );
  });

  it("data vazia pede a data completa", () => {
    expect(validarData("")).toBe("Data inválida: preencha a data completa (dd/mm/aaaa).");
  });

  it("29/02/2024 é válida (2024 é bissexto)", () => {
    expect(validarData("29/02/2024")).toBe("");
  });

  it("15/08/2020 é válida", () => {
    expect(validarData("15/08/2020")).toBe("");
  });
});

describe("formatarData (digitando)", () => {
  it("coloca as barras sozinho conforme digita", () => {
    expect(formatarData("1")).toBe("1");
    expect(formatarData("15")).toBe("15");
    expect(formatarData("150")).toBe("15/0");
    expect(formatarData("15082020")).toBe("15/08/2020");
  });

  it("não deixa digitar dia começando com 4 a 9", () => {
    expect(formatarData("4")).toBe("");
    expect(formatarData("9")).toBe("");
  });

  it("não deixa dia maior que 31 (35 vira 3)", () => {
    expect(formatarData("35")).toBe("3");
  });

  it("não deixa mês começando com 2 a 9 nem maior que 12", () => {
    expect(formatarData("152")).toBe("15");
    expect(formatarData("1513")).toBe("15/1");
  });

  it("ignora letras e passa de 8 dígitos sem erro", () => {
    expect(formatarData("15ab08")).toBe("15/08");
    expect(formatarData("150820201234")).toBe("15/08/2020");
  });

  it("ano depois do ano atual vira o ano atual", () => {
    hojeE(2026, 11, 5);
    expect(formatarData("01012099")).toBe("01/01/2026");
  });

  it("sem travar o ano (vacina, remédio, agenda): aceita 2027", () => {
    hojeE(2026, 11, 9);
    expect(formatarData("15012027", false)).toBe("15/01/2027");
  });

  it("travando o ano (true): 2027 vira 2026", () => {
    hojeE(2026, 11, 9);
    expect(formatarData("15012027", true)).toBe("15/01/2026");
  });

  it("sem travar o ano, data pela metade fica como está", () => {
    expect(formatarData("1501", false)).toBe("15/01");
  });

  it("paraDataISO devolve null se a data está incompleta", () => {
    expect(paraDataISO("15/08/20")).toBe(null);
    expect(paraDataISO("")).toBe(null);
  });
});

describe("Senha", () => {
  it("senha forte passa em todos os requisitos", () => {
    expect(validarSenha("Pontovet@2026")).toBe(true);
  });

  it("falta maiúscula", () => {
    expect(validarSenha("pontovet@2026")).toBe(false);
  });

  it("falta número", () => {
    expect(validarSenha("Pontovet@abc")).toBe(false);
  });

  it("falta caractere especial", () => {
    expect(validarSenha("Pontovet2026")).toBe(false);
  });

  it("menos de 8 caracteres", () => {
    expect(validarSenha("Ab@1")).toBe(false);
  });

  it("mostra quais requisitos faltam (para a lista verde e vermelha)", () => {
    const requisitos = requisitosSenha("abc");
    expect(requisitos).toHaveLength(4);
    expect(requisitos.map((r) => r.ok)).toEqual([false, false, false, false]);
    expect(requisitos[0].texto).toBe("Mínimo 8 caracteres");
  });
});

describe("CPF, CNPJ, telefone e CEP", () => {
  it("CPF completo", () => {
    expect(formatarCpf("12345678901")).toBe("123.456.789-01");
  });

  it("CPF enquanto digita", () => {
    expect(formatarCpf("1234")).toBe("123.4");
    expect(formatarCpf("1234567")).toBe("123.456.7");
  });

  it("CPF ignora letras e passa de 11 dígitos", () => {
    expect(formatarCpf("123.456.789-01999")).toBe("123.456.789-01");
    expect(formatarCpf("abc")).toBe("");
  });

  it("CNPJ completo", () => {
    expect(formatarCnpj("12345678000195")).toBe("12.345.678/0001-95");
  });

  it("telefone celular completo", () => {
    expect(formatarTelefone("47999998888")).toBe("(47) 99999-8888");
  });

  it("telefone fixo (10 dígitos) tem 4 antes do tracinho", () => {
    expect(formatarTelefone("4733334444")).toBe("(47) 3333-4444");
  });

  it("telefone com 6 a 10 dígitos já põe o tracinho com 4 antes", () => {
    expect(formatarTelefone("473333")).toBe("(47) 3333");
    expect(formatarTelefone("4733334")).toBe("(47) 3333-4");
  });

  it("telefone com mais de 11 dígitos corta o que passou", () => {
    expect(formatarTelefone("479999988889999")).toBe("(47) 99999-8888");
  });

  it("telefone enquanto digita", () => {
    expect(formatarTelefone("479")).toBe("(47) 9");
  });

  it("CEP completo", () => {
    expect(formatarCep("88330000")).toBe("88330-000");
  });

  it("CEP enquanto digita não coloca o hífen cedo", () => {
    expect(formatarCep("88330")).toBe("88330");
  });
});

describe("Campos obrigatórios", () => {
  it("camposVazios devolve só os campos em branco", () => {
    expect(camposVazios({ nome: "Ana", cpf: "" })).toEqual(["cpf"]);
  });

  it("campo só com espaços também conta como vazio", () => {
    expect(camposVazios({ nome: "   ", sobrenome: "Silva" })).toEqual(["nome"]);
  });

  it("tudo preenchido devolve lista vazia", () => {
    expect(camposVazios({ nome: "Ana", cpf: "123" })).toEqual([]);
  });

  it("campoVazio só fica vermelho depois de tentar enviar", () => {
    expect(campoVazio(false, "")).toBeFalsy();
    expect(campoVazio(true, "")).toBeTruthy();
    expect(campoVazio(true, "Ana")).toBeFalsy();
  });
});

describe("Idade aproximada do pet", () => {
  it("1 ano e 5 meses antes de 05/11/2026 é 05/06/2025", () => {
    hojeE(2026, 11, 5);
    expect(dataEstimada(1, 5)).toBe("2025-06-05");
  });

  it("0 anos e 0 meses é hoje", () => {
    hojeE(2026, 11, 5);
    expect(dataEstimada(0, 0)).toBe("2026-11-05");
  });

  it("só meses: 3 meses antes de 05/11/2026 é 05/08/2026", () => {
    hojeE(2026, 11, 5);
    expect(dataEstimada(0, 3)).toBe("2026-08-05");
  });

  it("virada de ano: 11 meses antes de 05/03/2026 é 05/04/2025", () => {
    hojeE(2026, 3, 5);
    expect(dataEstimada(0, 11)).toBe("2025-04-05");
  });

  it("dia 31 em mês curto vira o último dia (31/03 menos 1 mês = 28/02)", () => {
    hojeE(2026, 3, 31);
    expect(dataEstimada(0, 1)).toBe("2026-02-28");
  });

  it("idadeEmAnosEMeses: nascido em 20/10/2025 tem 1 ano", () => {
    hojeE(2026, 11, 5);
    expect(idadeEmAnosEMeses("2025-10-20")).toEqual({ anos: 1, meses: 0 });
  });

  it("idadeEmAnosEMeses: nascido em 05/06/2025 tem 1 ano e 5 meses", () => {
    hojeE(2026, 11, 5);
    expect(idadeEmAnosEMeses("2025-06-05")).toEqual({ anos: 1, meses: 5 });
  });

  it("idadeEmAnosEMeses: ainda não fez o mês completo (dia 6 em 05/11)", () => {
    hojeE(2026, 11, 5);
    expect(idadeEmAnosEMeses("2026-10-06")).toEqual({ anos: 0, meses: 0 });
  });

  it("idadeEmAnosEMeses: data no futuro não dá idade negativa", () => {
    hojeE(2026, 11, 5);
    expect(idadeEmAnosEMeses("2027-01-01")).toEqual({ anos: 0, meses: 0 });
  });

  it("ida e volta: a data estimada de 1 ano e 5 meses volta como 1 ano e 5 meses", () => {
    hojeE(2026, 11, 5);
    expect(idadeEmAnosEMeses(dataEstimada(1, 5))).toEqual({ anos: 1, meses: 5 });
  });

  it("textoIdade: '1 ano e 5 meses' (singular e plural)", () => {
    expect(textoIdade({ anos: 1, meses: 5 })).toBe("1 ano e 5 meses");
    expect(textoIdade({ anos: 2, meses: 1 })).toBe("2 anos e 1 mês");
  });

  it("textoIdade: só anos ou só meses", () => {
    expect(textoIdade({ anos: 2, meses: 0 })).toBe("2 anos");
    expect(textoIdade({ anos: 0, meses: 3 })).toBe("3 meses");
    expect(textoIdade({ anos: 0, meses: 1 })).toBe("1 mês");
  });

  it("textoIdade: bebê com menos de 1 mês", () => {
    expect(textoIdade({ anos: 0, meses: 0 })).toBe("menos de 1 mês");
  });
});
