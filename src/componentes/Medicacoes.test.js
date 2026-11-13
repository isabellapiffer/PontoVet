// Testes das funções de src/componentes/Medicacoes.jsx (frase pronta, dose, concentração).
// Rodar: npm test
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  erroNasMedicacoes,
  medicacaoParaSalvar,
  fimDaMedicacao,
  medicacaoVazia,
  nomeComConcentracao,
  resumoMedicacao,
  soDose,
  UNIDADES_DOSE,
  UNIDADES_CONCENTRACAO,
} from "./Medicacoes.jsx";

describe("resumoMedicacao (a frase pronta)", () => {
  it("1 ml, 2 vezes ao dia, durante 7 dias", () => {
    const med = {
      dose: "1", unidade: "ml", vezes: "2", intervalo: "1", intervaloTempo: "dia",
      ateNovasRecomendacoes: false, duracao: "7", duracaoTempo: "dia",
    };
    expect(resumoMedicacao(med)).toBe("1 ml, 2 vezes ao dia, durante 7 dias");
  });

  it("1 aplicação, 1 vez a cada 30 dias, até novas recomendações", () => {
    const med = {
      dose: "1", unidade: "aplicação", vezes: "1", intervalo: "30", intervaloTempo: "dia",
      ateNovasRecomendacoes: true, duracao: "7", duracaoTempo: "dia",
    };
    expect(resumoMedicacao(med)).toBe(
      "1 aplicação, 1 vez a cada 30 dias, até novas recomendações"
    );
  });

  it("2 vezes a cada 12 horas, durante 7 dias", () => {
    const med = {
      vezes: "2", intervalo: "12", intervaloTempo: "hora", duracao: "7", duracaoTempo: "dia",
    };
    expect(resumoMedicacao(med)).toBe("2 vezes a cada 12 horas, durante 7 dias");
  });

  it("1 vez a cada 24 horas, até novas recomendações", () => {
    const med = {
      vezes: "1", intervalo: "24", intervaloTempo: "hora", ateNovasRecomendacoes: true,
    };
    expect(resumoMedicacao(med)).toBe("1 vez a cada 24 horas, até novas recomendações");
  });

  it("com 1 de intervalo usa 'ao dia', 'por semana', 'por mês', 'por ano', 'por hora'", () => {
    const base = { vezes: "1", intervalo: "1" };
    expect(resumoMedicacao({ ...base, intervaloTempo: "hora" })).toBe("1 vez por hora");
    expect(resumoMedicacao({ ...base, intervaloTempo: "dia" })).toBe("1 vez ao dia");
    expect(resumoMedicacao({ ...base, intervaloTempo: "semana" })).toBe("1 vez por semana");
    expect(resumoMedicacao({ ...base, intervaloTempo: "mes" })).toBe("1 vez por mês");
    expect(resumoMedicacao({ ...base, intervaloTempo: "ano" })).toBe("1 vez por ano");
  });

  it("mês no plural vira 'meses' (a cada 2 meses)", () => {
    const med = { vezes: "1", intervalo: "2", intervaloTempo: "mes" };
    expect(resumoMedicacao(med)).toBe("1 vez a cada 2 meses");
  });

  it("durante 1 mês / 3 meses", () => {
    expect(resumoMedicacao({ duracao: "1", duracaoTempo: "mes" })).toBe("durante 1 mês");
    expect(resumoMedicacao({ duracao: "3", duracaoTempo: "mes" })).toBe("durante 3 meses");
  });

  it("dose sem unidade não deixa espaço sobrando", () => {
    expect(resumoMedicacao({ dose: "1/2", unidade: "" })).toBe("1/2");
  });

  it("dose 1/2 comprimido(s), 1 vez ao dia, até novas recomendações (exemplo Apoquel)", () => {
    const med = {
      dose: "1/2", unidade: "comprimido(s)", vezes: "1", intervalo: "1",
      intervaloTempo: "dia", ateNovasRecomendacoes: true,
    };
    expect(resumoMedicacao(med)).toBe(
      "1/2 comprimido(s), 1 vez ao dia, até novas recomendações"
    );
  });

  it("medicação em branco não gera frase", () => {
    expect(resumoMedicacao(medicacaoVazia())).toBe("");
  });
});

describe("nomeComConcentracao", () => {
  it("Dipirona 500 mg/ml", () => {
    expect(
      nomeComConcentracao({ nome: "Dipirona", concentracao: "500", concentracaoUnidade: "mg/ml" })
    ).toBe("Dipirona 500 mg/ml");
  });

  it("sem concentração mostra só o nome", () => {
    expect(nomeComConcentracao({ nome: "Apoquel", concentracao: "" })).toBe("Apoquel");
  });

  it("tira espaços do nome", () => {
    expect(nomeComConcentracao({ nome: "  Apoquel  ", concentracao: "" })).toBe("Apoquel");
  });

  it("concentração sem unidade não deixa espaço sobrando", () => {
    expect(nomeComConcentracao({ nome: "Dipirona", concentracao: "500" })).toBe("Dipirona 500");
  });
});

describe("soDose (campo da dose)", () => {
  it("aceita 1/2, 0,5, 0.5 e 1,5", () => {
    expect(soDose("1/2")).toBe("1/2");
    expect(soDose("0,5")).toBe("0,5");
    expect(soDose("0.25")).toBe("0.25");
    expect(soDose("1,5")).toBe("1,5");
  });

  it("não aceita letras nem outros símbolos", () => {
    expect(soDose("1a2")).toBe("12");
    expect(soDose("abc")).toBe("");
    expect(soDose("1-2 ml")).toBe("12");
  });
});

describe("medicação nova e listas de unidades", () => {
  it("medicação nova vem com 'horas' na frequência e campos de número vazios", () => {
    const med = medicacaoVazia();
    expect(med.intervaloTempo).toBe("hora");
    expect(med.vezes).toBe("");
    expect(med.intervalo).toBe("");
    expect(med.duracao).toBe("");
    expect(med.nome).toBe("");
  });

  it("cada medicação nova tem um id diferente", () => {
    expect(medicacaoVazia().id).not.toBe(medicacaoVazia().id);
  });

  it("unidades da dose do TESTES.md", () => {
    expect(UNIDADES_DOSE).toEqual([
      "mg", "ml", "g", "UI", "gotas", "comprimido(s)", "mcg", "pipeta(s)", "cápsula(s)", "aplicação",
    ]);
  });

  it("unidades da concentração do TESTES.md", () => {
    expect(UNIDADES_CONCENTRACAO).toEqual(["mg", "mg/ml", "mcg", "g", "UI", "UI/ml", "%"]);
  });
});

// "Hoje" fixo: 05/11/2026
function hojeE(ano, mes, dia) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(ano, mes - 1, dia));
}

afterEach(() => vi.useRealTimers());

describe("erroNasMedicacoes (conferir antes de salvar)", () => {
  it("lista vazia ou só com medicação em branco não tem erro", () => {
    expect(erroNasMedicacoes([])).toBe("");
    expect(erroNasMedicacoes([medicacaoVazia()])).toBe("");
  });

  it("dose preenchida mas sem nome pede o nome", () => {
    const med = { ...medicacaoVazia(), dose: "1", unidade: "ml" };
    expect(erroNasMedicacoes([med])).toBe(
      "Escreva o nome de cada medicação (ou remova a que está em branco)."
    );
  });

  it("nome só com espaços e nada mais conta como em branco", () => {
    expect(erroNasMedicacoes([{ ...medicacaoVazia(), nome: "   " }])).toBe("");
  });

  it("Librela mensal com última dose 24/09/2026 está certo", () => {
    hojeE(2026, 11, 5);
    const med = { ...medicacaoVazia(), nome: "Librela", intervalo: "1", intervaloTempo: "mes", ultimaDose: "24/09/2026" };
    expect(erroNasMedicacoes([med])).toBe("");
  });

  it("última dose hoje (05/11/2026) é aceita", () => {
    hojeE(2026, 11, 5);
    const med = { ...medicacaoVazia(), nome: "Librela", intervaloTempo: "mes", ultimaDose: "05/11/2026" };
    expect(erroNasMedicacoes([med])).toBe("");
  });

  it("última dose no futuro (06/11/2026) dá erro com o nome do remédio", () => {
    hojeE(2026, 11, 5);
    const med = { ...medicacaoVazia(), nome: "Librela", intervaloTempo: "mes", ultimaDose: "06/11/2026" };
    expect(erroNasMedicacoes([med])).toBe("Librela: a data da última dose não pode ser no futuro.");
  });

  it("última dose com data inexistente (31/02/2026) mostra o erro da data", () => {
    hojeE(2026, 11, 5);
    const med = { ...medicacaoVazia(), nome: "Librela", intervaloTempo: "mes", ultimaDose: "31/02/2026" };
    expect(erroNasMedicacoes([med])).toBe("Librela: Data inválida: fevereiro de 2026 não tem dia 31.");
  });

  it("em remédio de horas ou dias a última dose não é conferida", () => {
    hojeE(2026, 11, 5);
    const med = { ...medicacaoVazia(), nome: "Apoquel", intervaloTempo: "hora", ultimaDose: "31/02/2099" };
    expect(erroNasMedicacoes([med])).toBe("");
  });

  it("acha o erro mesmo quando está na segunda medicação", () => {
    hojeE(2026, 11, 5);
    const boa = { ...medicacaoVazia(), nome: "Apoquel" };
    const ruim = { ...medicacaoVazia(), nome: "Librela", intervaloTempo: "mes", ultimaDose: "01/01/2030" };
    expect(erroNasMedicacoes([boa, ruim])).toBe("Librela: a data da última dose não pode ser no futuro.");
  });
});

describe("medicacaoParaSalvar (pronta para o banco)", () => {
  it("tira o id, tira espaços do nome e troca a data para o formato do banco", () => {
    const med = {
      ...medicacaoVazia(), nome: "  Librela ", intervalo: "1", intervaloTempo: "mes", ultimaDose: "24/09/2026",
    };
    const pronta = medicacaoParaSalvar(med);
    expect(pronta).not.toHaveProperty("id");
    expect(pronta.nome).toBe("Librela");
    expect(pronta.ultimaDose).toBe("2026-09-24");
    expect(pronta.intervalo).toBe("1");
  });

  it("remédio de horas guarda a última dose como null", () => {
    const med = { ...medicacaoVazia(), nome: "Apoquel", intervaloTempo: "hora", ultimaDose: "24/09/2026" };
    expect(medicacaoParaSalvar(med).ultimaDose).toBe(null);
  });

  it("remédio mensal sem última dose guarda null", () => {
    const med = { ...medicacaoVazia(), nome: "Librela", intervaloTempo: "mes", ultimaDose: "" };
    expect(medicacaoParaSalvar(med).ultimaDose).toBe(null);
  });
});

describe("fimDaMedicacao (até quando vai)", () => {
  it("registrada em 05/11/2026 por 7 dias vai até 12/11/2026", () => {
    const med = { registradoEm: "2026-11-05", duracao: "7", duracaoTempo: "dia" };
    expect(fimDaMedicacao(med)).toBe("2026-11-12");
  });

  it("registrada em 05/11/2026 por 2 meses vai até 05/01/2027", () => {
    const med = { registradoEm: "2026-11-05", duracao: "2", duracaoTempo: "mes" };
    expect(fimDaMedicacao(med)).toBe("2027-01-05");
  });

  it("'até novas recomendações' não tem fim", () => {
    const med = { registradoEm: "2026-11-05", duracao: "7", duracaoTempo: "dia", ateNovasRecomendacoes: true };
    expect(fimDaMedicacao(med)).toBe(null);
  });

  it("sem duração ou sem data do registro não tem fim", () => {
    expect(fimDaMedicacao({ registradoEm: "2026-11-05", duracao: "", duracaoTempo: "dia" })).toBe(null);
    expect(fimDaMedicacao({ duracao: "7", duracaoTempo: "dia" })).toBe(null);
  });
});
