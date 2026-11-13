// Testes de src/lembretes.js: datas dos lembretes de remédio e de vacina.
// Rodar: npm test
import { describe, it, expect, vi, afterEach } from "vitest";

// O lembretes.js importa o Supabase. Aqui ele é FALSO: nenhum pedido sai de verdade.
vi.mock("./supabaseClient.js", () => ({ supabase: {} }));

import {
  hojeISO,
  somarIntervalo,
  lembretesDoPet,
  lembretesDeHoje,
  TEMPOS_COM_LEMBRETE,
  minutosAntes,
  voltarMinutos,
  horariosDoPreparo,
  resumoPreparo,
  avisosDoPreparo,
  avisosDoPreparoDeHoje,
  proximosDaAgenda,
  proximosDaTelaInicial,
  quandoEOnde,
  nomeDoTipo,
  itensDosCompromissos,
} from "./lembretes.js";

// "Hoje" fixo: 24/10/2026 (o dia do exemplo do TESTES.md)
function hojeE(ano, mes, dia) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(ano, mes - 1, dia));
}

afterEach(() => vi.useRealTimers());

describe("hojeISO", () => {
  it("devolve a data de hoje no formato do banco", () => {
    hojeE(2026, 10, 24);
    expect(hojeISO()).toBe("2026-10-24");
  });

  it("coloca zero à esquerda no mês e no dia", () => {
    hojeE(2026, 3, 5);
    expect(hojeISO()).toBe("2026-03-05");
  });
});

describe("somarIntervalo", () => {
  it("soma dias", () => {
    expect(somarIntervalo("2026-10-24", 21, "dia")).toBe("2026-11-14");
  });

  it("soma semanas", () => {
    expect(somarIntervalo("2026-10-01", 2, "semana")).toBe("2026-10-15");
  });

  it("soma meses: 24/09 + 1 mês = 24/10", () => {
    expect(somarIntervalo("2026-09-24", 1, "mes")).toBe("2026-10-24");
  });

  it("soma 1 ano: 24/10/2026 + 1 ano = 24/10/2027", () => {
    expect(somarIntervalo("2026-10-24", 1, "ano")).toBe("2027-10-24");
  });

  it("virada de ano: 15/12 + 2 meses = 15/02 do ano seguinte", () => {
    expect(somarIntervalo("2026-12-15", 2, "mes")).toBe("2027-02-15");
  });

  it("dia 31 num mês curto vira o último dia (31/01 + 1 mês = 28/02)", () => {
    expect(somarIntervalo("2026-01-31", 1, "mes")).toBe("2026-02-28");
  });

  it("ano bissexto: 31/01/2024 + 1 mês = 29/02/2024", () => {
    expect(somarIntervalo("2024-01-31", 1, "mes")).toBe("2024-02-29");
  });

  it("29/02/2024 + 1 ano = 28/02/2025", () => {
    expect(somarIntervalo("2024-02-29", 1, "ano")).toBe("2025-02-28");
  });

  it("aceita a quantidade como texto ('21')", () => {
    expect(somarIntervalo("2026-10-24", "21", "dia")).toBe("2026-11-14");
  });

  it("hora (ou tempo desconhecido) não gera data", () => {
    expect(somarIntervalo("2026-10-24", 12, "hora")).toBe(null);
    expect(somarIntervalo("2026-10-24", 1, "século")).toBe(null);
  });
});

describe("quais frequências geram lembrete", () => {
  it("só semana, mês e ano (hora e dia ficariam lembrando todo dia)", () => {
    expect(TEMPOS_COM_LEMBRETE).toEqual(["semana", "mes", "ano"]);
  });
});

describe("lembretesDoPet", () => {
  const hanna = { id: 7, nome: "Hanna" };

  it("Librela a cada 1 mês, última dose 24/09: lembra em 24/10", () => {
    const pet = {
      ...hanna,
      medicacoes: [
        { nome: "Librela", intervalo: "1", intervaloTempo: "mes", ultimaDose: "2026-09-24" },
      ],
    };
    const lembretes = lembretesDoPet(pet);
    expect(lembretes).toHaveLength(1);
    expect(lembretes[0]).toMatchObject({
      tipo: "medicacao",
      titulo: "Librela",
      data: "2026-10-24",
    });
    expect(lembretes[0].pet).toBe(pet);
  });

  it("remédio de horas ou dias não gera lembrete", () => {
    const pet = {
      ...hanna,
      medicacoes: [
        { nome: "Apoquel", intervalo: "12", intervaloTempo: "hora", ultimaDose: "2026-10-01" },
        { nome: "Dipirona", intervalo: "1", intervaloTempo: "dia", ultimaDose: "2026-10-01" },
      ],
    };
    expect(lembretesDoPet(pet)).toEqual([]);
  });

  it("remédio sem 'última dose' ou sem intervalo não gera lembrete", () => {
    const pet = {
      ...hanna,
      medicacoes: [
        { nome: "A", intervalo: "1", intervaloTempo: "mes", ultimaDose: "" },
        { nome: "B", intervalo: "", intervaloTempo: "mes", ultimaDose: "2026-09-24" },
      ],
    };
    expect(lembretesDoPet(pet)).toEqual([]);
  });

  it("dado quebrado (medicação sem nome, vacina sem data) não derruba a função", () => {
    const pet = {
      ...hanna,
      medicacoes: [null, { intervalo: "1", intervaloTempo: "mes", ultimaDose: "2026-09-24" }],
      vacinas: [null, { produto: "V10" }, { data: "2026-01-01" }],
    };
    expect(lembretesDoPet(pet)).toEqual([]);
  });

  it("pet sem medicações nem vacinas devolve lista vazia", () => {
    expect(lembretesDoPet(hanna)).toEqual([]);
  });

  it("vacina com próxima dose vira lembrete 'Vacina V10'", () => {
    const pet = {
      ...hanna,
      vacinas: [{ produto: "V10", data: "2026-10-24", proxima: "2026-11-14" }],
    };
    expect(lembretesDoPet(pet)).toMatchObject([
      { tipo: "vacina", titulo: "Vacina V10", data: "2026-11-14" },
    ]);
  });

  it("vacina sem próxima dose não gera lembrete", () => {
    const pet = { ...hanna, vacinas: [{ produto: "Raiva", data: "2026-10-24" }] };
    expect(lembretesDoPet(pet)).toEqual([]);
  });

  it("vale a dose mais recente da mesma vacina (mesmo nome, maiúscula diferente)", () => {
    const pet = {
      ...hanna,
      vacinas: [
        { produto: "V10", data: "2026-01-10", proxima: "2026-02-01" },
        { produto: "v10", data: "2026-10-10", proxima: "2027-10-10" },
      ],
    };
    const lembretes = lembretesDoPet(pet);
    expect(lembretes).toHaveLength(1);
    expect(lembretes[0].data).toBe("2027-10-10");
  });

  it("devolve do mais antigo para o mais novo", () => {
    const pet = {
      ...hanna,
      medicacoes: [
        { nome: "Librela", intervalo: "1", intervaloTempo: "mes", ultimaDose: "2026-09-24" },
      ],
      vacinas: [{ produto: "Raiva", data: "2026-01-01", proxima: "2026-10-01" }],
    };
    expect(lembretesDoPet(pet).map((l) => l.titulo)).toEqual(["Vacina Raiva", "Librela"]);
  });
});

describe("lembretesDeHoje", () => {
  it("só traz o que chegou: hoje ou atrasado, não o futuro", () => {
    hojeE(2026, 10, 24);
    const pets = [
      {
        id: 1,
        nome: "Hanna",
        medicacoes: [
          { nome: "Librela", intervalo: "1", intervaloTempo: "mes", ultimaDose: "2026-09-24" },
        ],
        vacinas: [{ produto: "V10", data: "2026-10-01", proxima: "2026-11-14" }],
      },
    ];
    expect(lembretesDeHoje(pets).map((l) => l.titulo)).toEqual(["Librela"]);
  });

  it("incluir atrasado: última dose 10/09 e mensal vence em 10/10", () => {
    hojeE(2026, 10, 24);
    const pets = [
      {
        id: 1,
        nome: "Hanna",
        medicacoes: [
          { nome: "Librela", intervalo: "1", intervaloTempo: "mes", ultimaDose: "2026-09-10" },
        ],
      },
    ];
    expect(lembretesDeHoje(pets)[0].data).toBe("2026-10-10");
  });

  it("registrar nova dose com próxima no futuro faz o lembrete da vacina sumir", () => {
    hojeE(2026, 10, 24);
    const pets = [
      {
        id: 1,
        nome: "Hanna",
        vacinas: [
          { produto: "V10", data: "2026-01-10", proxima: "2026-10-24" },
          { produto: "V10", data: "2026-10-24", proxima: "2027-10-24" },
        ],
      },
    ];
    expect(lembretesDeHoje(pets)).toEqual([]);
  });

  it("sem pets não há lembretes", () => {
    expect(lembretesDeHoje([])).toEqual([]);
  });

  it("junta os lembretes de vários pets, do mais antigo para o mais novo", () => {
    hojeE(2026, 10, 24);
    const pets = [
      { id: 1, nome: "Hanna", vacinas: [{ produto: "Raiva", data: "2026-01-01", proxima: "2026-10-20" }] },
      { id: 2, nome: "Thor", vacinas: [{ produto: "V10", data: "2026-01-01", proxima: "2026-10-10" }] },
    ];
    expect(lembretesDeHoje(pets).map((l) => l.pet.nome)).toEqual(["Thor", "Hanna"]);
  });
});

describe("lembretesDoPet: vermífugo e antipulgas", () => {
  const hanna = { id: 7, nome: "Hanna" };

  it("vermífugo com próxima dose vira lembrete 'Vermífugo Drontal'", () => {
    const pet = {
      ...hanna,
      vermifugacoes: [{ produto: "Drontal", data: "2026-10-10", proxima: "2027-01-10" }],
    };
    expect(lembretesDoPet(pet)).toMatchObject([
      { id: "7-vermifugo-Drontal", tipo: "vermifugo", titulo: "Vermífugo Drontal", data: "2027-01-10" },
    ]);
  });

  it("antipulgas com próxima dose vira lembrete 'Antipulgas e carrapatos NexGard'", () => {
    const pet = {
      ...hanna,
      antiparasitarios: [{ produto: "NexGard", data: "2026-10-10", proxima: "2026-11-10" }],
    };
    expect(lembretesDoPet(pet)).toMatchObject([
      { tipo: "antiparasitario", titulo: "Antipulgas e carrapatos NexGard", data: "2026-11-10" },
    ]);
  });

  it("trocou de Drontal para Milbemax: só vale a próxima do mais recente", () => {
    const pet = {
      ...hanna,
      vermifugacoes: [
        { produto: "Drontal", data: "2026-01-10", proxima: "2026-04-10" },
        { produto: "Milbemax", data: "2026-10-10", proxima: "2027-01-10" },
      ],
    };
    const lembretes = lembretesDoPet(pet);
    expect(lembretes).toHaveLength(1);
    expect(lembretes[0].titulo).toBe("Vermífugo Milbemax");
  });

  it("dois produtos na mesma data mais recente: os dois geram lembrete", () => {
    const pet = {
      ...hanna,
      vermifugacoes: [
        { produto: "Drontal", data: "2026-10-10", proxima: "2027-01-10" },
        { produto: "Milbemax", data: "2026-10-10", proxima: "2027-01-12" },
      ],
    };
    expect(lembretesDoPet(pet).map((l) => l.titulo)).toEqual([
      "Vermífugo Drontal",
      "Vermífugo Milbemax",
    ]);
  });

  it("se a vez mais recente não tem próxima dose, a antiga não volta a lembrar", () => {
    const pet = {
      ...hanna,
      vermifugacoes: [
        { produto: "Drontal", data: "2026-01-10", proxima: "2026-04-10" },
        { produto: "Drontal", data: "2026-10-10" },
      ],
    };
    expect(lembretesDoPet(pet)).toEqual([]);
  });

  it("registro quebrado (null, sem produto, sem data) é ignorado", () => {
    const pet = {
      ...hanna,
      vermifugacoes: [null, { data: "2026-10-10", proxima: "2027-01-10" }, { produto: "Drontal" }],
      antiparasitarios: [],
    };
    expect(lembretesDoPet(pet)).toEqual([]);
  });
});

describe("minutosAntes", () => {
  it("'10 gotas, 1 hora antes' vale 60 minutos", () => {
    expect(minutosAntes("10 gotas, 1 hora antes")).toBe(60);
  });

  it("'30 minutos antes' vale 30", () => {
    expect(minutosAntes("30 minutos antes")).toBe(30);
  });

  it("'2 h antes' vale 120 e maiúscula não atrapalha", () => {
    expect(minutosAntes("2 h antes")).toBe(120);
    expect(minutosAntes("1 HORA ANTES")).toBe(60);
  });

  it("sem 'antes' ou vazio devolve null", () => {
    expect(minutosAntes("10 gotas pela manhã")).toBe(null);
    expect(minutosAntes("")).toBe(null);
    expect(minutosAntes(undefined)).toBe(null);
  });
});

describe("voltarMinutos", () => {
  it("exame 12/11 às 09:00, 8 horas antes: 12/11 às 01:00", () => {
    expect(voltarMinutos("2026-11-12", "09:00", 480)).toEqual({ data: "2026-11-12", hora: "01:00" });
  });

  it("exame 12/11 às 06:00, 8 horas antes: cai no dia 11 às 22:00", () => {
    expect(voltarMinutos("2026-11-12", "06:00", 480)).toEqual({ data: "2026-11-11", hora: "22:00" });
  });

  it("volta para o mês anterior: 01/12 00:30 menos 1 hora = 30/11 23:30", () => {
    expect(voltarMinutos("2026-12-01", "00:30", 60)).toEqual({ data: "2026-11-30", hora: "23:30" });
  });

  it("volta para o ano anterior: 01/01/2027 01:00 menos 2 horas = 31/12/2026 23:00", () => {
    expect(voltarMinutos("2027-01-01", "01:00", 120)).toEqual({ data: "2026-12-31", hora: "23:00" });
  });
});

describe("horariosDoPreparo", () => {
  const preparo = {
    jejumHoras: 8,
    medicamento: { nome: "Luftal", instrucao: "10 gotas, 1 hora antes" },
  };

  it("jejum de 8h e Luftal 1h antes, exame 12/11 às 09:00", () => {
    expect(horariosDoPreparo(preparo, "2026-11-12", "09:00")).toEqual({
      jejum: { data: "2026-11-12", hora: "01:00" },
      medicamento: { data: "2026-11-12", hora: "08:00" },
    });
  });

  it("aceita o jejum como texto ('8')", () => {
    expect(horariosDoPreparo({ jejumHoras: "8" }, "2026-11-12", "09:00").jejum).toEqual({
      data: "2026-11-12",
      hora: "01:00",
    });
  });

  it("sem a hora do exame não dá para calcular nada", () => {
    expect(horariosDoPreparo(preparo, "2026-11-12", "")).toEqual({ jejum: null, medicamento: null });
  });

  it("sem preparo não calcula nada", () => {
    expect(horariosDoPreparo(null, "2026-11-12", "09:00")).toEqual({ jejum: null, medicamento: null });
  });

  it("instrução sem 'antes' não gera horário do remédio", () => {
    const p = { medicamento: { nome: "Luftal", instrucao: "10 gotas" } };
    expect(horariosDoPreparo(p, "2026-11-12", "09:00").medicamento).toBe(null);
  });

  it("jejum 0 não gera horário", () => {
    expect(horariosDoPreparo({ jejumHoras: 0 }, "2026-11-12", "09:00").jejum).toBe(null);
  });
});

describe("resumoPreparo", () => {
  it("jejum, remédio e outro juntos", () => {
    const preparo = {
      jejumHoras: 8,
      medicamento: { nome: "Luftal", instrucao: "10 gotas, 1 hora antes" },
      outro: "Levar a urina",
    };
    expect(resumoPreparo(preparo)).toBe(
      "Jejum de 8 horas · Luftal: 10 gotas, 1 hora antes · Levar a urina"
    );
  });

  it("1 hora de jejum fica no singular", () => {
    expect(resumoPreparo({ jejumHoras: 1 })).toBe("Jejum de 1 hora");
  });

  it("remédio sem instrução mostra só o nome", () => {
    expect(resumoPreparo({ medicamento: { nome: "Luftal", instrucao: "" } })).toBe("Luftal");
  });

  it("sem preparo devolve texto vazio", () => {
    expect(resumoPreparo(null)).toBe("");
    expect(resumoPreparo({})).toBe("");
  });
});

describe("avisosDoPreparo", () => {
  const hanna = { id: 7, nome: "Hanna" };

  it("exame 12/11 às 06:00 com jejum de 8h: aviso 'Jejum a partir de 22:00' começa no dia 11", () => {
    const exame = { id: 5, data: "2026-11-12", hora: "06:00:00", preparo: { jejumHoras: 8 } };
    expect(avisosDoPreparo(exame, hanna)).toEqual([
      {
        id: "preparo-5-jejum",
        tipo: "preparo",
        titulo: "Jejum a partir de 22:00",
        data: "2026-11-11",
        ateData: "2026-11-12",
        pet: hanna,
      },
    ]);
  });

  it("remédio com hora do exame: 'Dar Luftal às 08:00'", () => {
    const exame = {
      id: 5,
      data: "2026-11-12",
      hora: "09:00",
      preparo: { medicamento: { nome: "Luftal", instrucao: "10 gotas, 1 hora antes" } },
    };
    expect(avisosDoPreparo(exame, hanna)).toMatchObject([
      { titulo: "Dar Luftal às 08:00", data: "2026-11-12", ateData: "2026-11-12" },
    ]);
  });

  it("sem hora do exame: avisa só no dia, com o tempo de jejum e a instrução do remédio", () => {
    const exame = {
      id: 5,
      data: "2026-11-12",
      hora: null,
      preparo: { jejumHoras: 8, medicamento: { nome: "Luftal", instrucao: "10 gotas, 1 hora antes" } },
    };
    expect(avisosDoPreparo(exame, hanna).map((a) => [a.titulo, a.data])).toEqual([
      ["Jejum de 8 horas", "2026-11-12"],
      ["Luftal: 10 gotas, 1 hora antes", "2026-11-12"],
    ]);
  });

  it("campo 'outro' vira um aviso com o próprio texto", () => {
    const exame = { id: 5, data: "2026-11-12", hora: "09:00", preparo: { outro: "Levar a urina" } };
    expect(avisosDoPreparo(exame, hanna)).toMatchObject([
      { id: "preparo-5-outro", titulo: "Levar a urina", data: "2026-11-12" },
    ]);
  });

  it("sem preparo ou sem pet não há avisos", () => {
    expect(avisosDoPreparo({ id: 5, data: "2026-11-12", hora: "09:00" }, hanna)).toEqual([]);
    expect(avisosDoPreparo({ id: 5, data: "2026-11-12", preparo: { jejumHoras: 8 } }, undefined)).toEqual([]);
  });
});

describe("avisosDoPreparoDeHoje", () => {
  const pets = [{ id: 7, nome: "Hanna" }];
  // Jejum começa 11/11 às 22:00 e vale até o exame, 12/11
  const compromissos = [
    { id: 5, pet_id: 7, data: "2026-11-12", hora: "06:00:00", preparo: { jejumHoras: 8 } },
  ];

  it("no dia anterior ao exame (11/11) o aviso do jejum aparece", () => {
    hojeE(2026, 11, 11);
    expect(avisosDoPreparoDeHoje(compromissos, pets).map((a) => a.titulo)).toEqual([
      "Jejum a partir de 22:00",
    ]);
  });

  it("no dia do exame (12/11) o aviso ainda aparece", () => {
    hojeE(2026, 11, 12);
    expect(avisosDoPreparoDeHoje(compromissos, pets)).toHaveLength(1);
  });

  it("dois dias antes (10/11) ainda não aparece", () => {
    hojeE(2026, 11, 10);
    expect(avisosDoPreparoDeHoje(compromissos, pets)).toEqual([]);
  });

  it("depois do exame (13/11) o aviso some", () => {
    hojeE(2026, 11, 13);
    expect(avisosDoPreparoDeHoje(compromissos, pets)).toEqual([]);
  });

  it("compromisso de um pet que não está na lista é ignorado", () => {
    hojeE(2026, 11, 12);
    expect(avisosDoPreparoDeHoje([{ ...compromissos[0], pet_id: 99 }], pets)).toEqual([]);
  });
});

// "Próximos agendamentos" embaixo da lista do dia.
// "Hoje" fica fixo em 09/11/2026 para o teste não mudar com o dia.
describe("proximosDaAgenda", () => {
  const HOJE = "2026-11-09";
  const titulos = (itens) => itens.map((item) => item.titulo);

  it("mostra só depois de hoje: atrasado e hoje ficam de fora", () => {
    const itens = [
      { titulo: "Vacina V10 atrasada", data: "2026-11-01" },
      { titulo: "Remédio de hoje", data: "2026-11-09" },
      { titulo: "Vacina V10", data: "2026-11-30" },
    ];
    expect(titulos(proximosDaAgenda(itens, HOJE, HOJE))).toEqual(["Vacina V10"]);
  });

  it("ordena do mais perto para o mais longe", () => {
    const itens = [
      { titulo: "Raiva", data: "2027-01-22" },
      { titulo: "Vacina V10", data: "2026-11-30" },
      { titulo: "Consulta", data: "2026-11-11" },
    ];
    expect(titulos(proximosDaAgenda(itens, HOJE, HOJE))).toEqual(["Consulta", "Vacina V10", "Raiva"]);
  });

  it("no mesmo dia, o que tem hora vem primeiro, em ordem de hora", () => {
    const itens = [
      { titulo: "Lembrete sem hora", data: "2026-11-20" },
      { titulo: "Exame 15:00", data: "2026-11-20", hora: "15:00" },
      { titulo: "Consulta 08:30", data: "2026-11-20", hora: "08:30" },
    ];
    expect(titulos(proximosDaAgenda(itens, HOJE, HOJE))).toEqual([
      "Consulta 08:30",
      "Exame 15:00",
      "Lembrete sem hora",
    ]);
  });

  it("mostra no máximo 5 itens", () => {
    const itens = ["10", "11", "12", "13", "14", "15", "16"].map((dia) => ({
      titulo: `Dia ${dia}`,
      data: `2026-11-${dia}`,
    }));
    expect(titulos(proximosDaAgenda(itens, HOJE, HOJE))).toEqual([
      "Dia 10",
      "Dia 11",
      "Dia 12",
      "Dia 13",
      "Dia 14",
    ]);
  });

  it("tocou no dia 11: a consulta desse dia não repete nos próximos", () => {
    const itens = [
      { titulo: "Consulta · Hanna", data: "2026-11-11", hora: "15:00" },
      { titulo: "Vacina V10 · Hanna", data: "2026-11-30" },
    ];
    expect(titulos(proximosDaAgenda(itens, HOJE, "2026-11-11"))).toEqual(["Vacina V10 · Hanna"]);
  });
});

// "Próximos agendamentos" da tela inicial: compromissos de hoje em diante,
// lembretes de amanhã em diante (os de hoje já estão em Lembretes), no máximo 5.
describe("proximosDaTelaInicial", () => {
  const HOJE = "2026-11-09";
  const titulos = (itens) => itens.map((item) => item.titulo);
  const hanna = {
    id: 1,
    nome: "Hanna",
    vacinas: [{ produto: "V10", data: "2026-11-09", proxima: "2026-11-30" }],
  };
  const vex = { id: 2, nome: "Vex", vacinas: [{ produto: "Raiva", data: "2026-01-09", proxima: "2026-11-09" }] };

  it("consulta de hoje entra; lembrete de hoje não (já está em Lembretes)", () => {
    const compromissos = [
      { id: 7, pet_id: 1, tipo: "consulta", titulo: "Consulta", data: "2026-11-09", hora: "15:00:00", local: "Dra Ana" },
    ];
    const itens = proximosDaTelaInicial([hanna, vex], compromissos, HOJE);
    expect(titulos(itens)).toEqual(["Consulta", "Vacina V10"]);
    expect(itens[0].hora).toBe("15:00");
    expect(itens[0].pet.nome).toBe("Hanna");
  });

  it("compromisso de ontem não entra", () => {
    const compromissos = [{ id: 7, pet_id: 1, tipo: "exame", titulo: "Hemograma", data: "2026-11-08" }];
    expect(titulos(proximosDaTelaInicial([hanna], compromissos, HOJE))).toEqual(["Vacina V10"]);
  });

  it("compromisso de pet apagado não entra (e não quebra a tela)", () => {
    const compromissos = [{ id: 7, pet_id: 99, tipo: "consulta", titulo: "Consulta", data: "2026-11-10" }];
    expect(titulos(proximosDaTelaInicial([hanna], compromissos, HOJE))).toEqual(["Vacina V10"]);
  });

  it("mistura compromissos e lembretes por data e mostra no máximo 5", () => {
    const compromissos = ["10", "12", "14", "16", "18"].map((dia, i) => ({
      id: i,
      pet_id: 2,
      tipo: "consulta",
      titulo: `Consulta dia ${dia}`,
      data: `2026-11-${dia}`,
    }));
    const thor = { id: 3, nome: "Thor", vacinas: [{ produto: "V8", data: "2026-01-01", proxima: "2026-11-11" }] };
    expect(titulos(proximosDaTelaInicial([hanna, vex, thor], compromissos, HOJE))).toEqual([
      "Consulta dia 10",
      "Vacina V8",
      "Consulta dia 12",
      "Consulta dia 14",
      "Consulta dia 16",
    ]);
  });
});

// 2ª linha do card da tela inicial
describe("quandoEOnde", () => {
  it("compromisso com hora e local: '11/11 às 15:00 · Dra Ana'", () => {
    const item = { tipo: "consulta", data: "2026-11-11", hora: "15:00", compromisso: { local: "Dra Ana" } };
    expect(quandoEOnde(item)).toBe("11/11 às 15:00 · Dra Ana");
  });

  it("compromisso sem hora e sem local: só a data", () => {
    const item = { tipo: "exame", data: "2026-11-21", hora: "", compromisso: { local: null } };
    expect(quandoEOnde(item)).toBe("21/11");
  });

  it("lembrete de vacina: '30/11 · Lembrete de vacina'", () => {
    expect(quandoEOnde({ tipo: "vacina", data: "2026-11-30" })).toBe("30/11 · Lembrete de vacina");
  });

  it("lembrete de remédio: '14/11 · Lembrete de remédio'", () => {
    expect(quandoEOnde({ tipo: "medicacao", data: "2026-11-14" })).toBe("14/11 · Lembrete de remédio");
  });
});

// Nome do tipo: com compromisso = agendado pelo tutor; sem = lembrete do app
describe("nomeDoTipo", () => {
  const compromisso = { id: 7 };

  it("vacina", () => {
    expect(nomeDoTipo({ tipo: "vacina", compromisso })).toBe("Vacina agendada");
    expect(nomeDoTipo({ tipo: "vacina" })).toBe("Lembrete de vacina");
  });

  it("vermífugo", () => {
    expect(nomeDoTipo({ tipo: "vermifugo", compromisso })).toBe("Vermífugo agendado");
    expect(nomeDoTipo({ tipo: "vermifugo" })).toBe("Lembrete de vermífugo");
  });

  it("antipulgas e carrapatos", () => {
    expect(nomeDoTipo({ tipo: "antiparasitario", compromisso })).toBe("Antipulgas e carrapatos agendado");
    expect(nomeDoTipo({ tipo: "antiparasitario" })).toBe("Lembrete de antipulgas e carrapatos");
  });

  it("consulta, remédio e tipo desconhecido", () => {
    expect(nomeDoTipo({ tipo: "consulta", compromisso })).toBe("Consulta");
    expect(nomeDoTipo({ tipo: "medicacao" })).toBe("Lembrete de remédio");
    expect(nomeDoTipo({ tipo: "banho", compromisso })).toBe("Compromisso");
  });
});

describe("itensDosCompromissos", () => {
  const pets = [{ id: 1, nome: "Hanna" }];
  const consulta = { id: 7, pet_id: 1, tipo: "consulta", titulo: "Consulta", data: "2026-11-11", hora: "14:30:00" };

  it("consulta da Hanna vira item da lista, com a hora sem os segundos", () => {
    expect(itensDosCompromissos([consulta], pets)).toEqual([
      {
        id: "compromisso-7",
        tipo: "consulta",
        titulo: "Consulta",
        data: "2026-11-11",
        hora: "14:30",
        pet: { id: 1, nome: "Hanna" },
        compromisso: consulta,
      },
    ]);
  });

  it("sem hora: a hora fica vazia", () => {
    const [item] = itensDosCompromissos([{ ...consulta, hora: null }], pets);
    expect(item.hora).toBe("");
  });

  it("compromisso de pet fora da lista (pet_id 99) fica de fora", () => {
    expect(itensDosCompromissos([{ ...consulta, pet_id: 99 }], pets)).toEqual([]);
  });
});
