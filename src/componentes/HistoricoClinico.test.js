// Testes de funções de src/componentes/HistoricoClinico.jsx que ainda não tinham teste:
// resumo dos testes FIV/FeLV, lista de itens e pet antigo.
// (Doenças e medicações dentro da doença estão em testes/historicoClinico.test.js)
// Rodar: npm test
import { describe, it, expect } from "vitest";
import { resumoTeste, itensPreenchidos, historicoInicial } from "./HistoricoClinico.jsx";

describe("resumoTeste (FIV e FeLV, só gatos)", () => {
  it("não testado", () => {
    expect(resumoTeste({ testado: false, registros: [] })).toBe("Não testado");
  });

  it("ainda não respondeu: 'Não preenchido'", () => {
    expect(resumoTeste({ testado: null, registros: [] })).toBe("Não preenchido");
    expect(resumoTeste(undefined)).toBe("Não preenchido");
  });

  it("marcou Sim mas não registrou nenhum teste: 'Não preenchido'", () => {
    expect(resumoTeste({ testado: true, registros: [] })).toBe("Não preenchido");
  });

  it("testado: 'Última: Negativo · 10/09/2026'", () => {
    const teste = { testado: true, registros: [{ resultado: "Negativo", data: "2026-09-10" }] };
    expect(resumoTeste(teste)).toBe("Última: Negativo · 10/09/2026");
  });
});

describe("itensPreenchidos (alergias e cirurgias)", () => {
  it("tira linhas em branco e espaços", () => {
    expect(itensPreenchidos(["Frango", "", "  ", " Dipirona "])).toEqual(["Frango", "Dipirona"]);
  });

  it("tudo em branco devolve lista vazia", () => {
    expect(itensPreenchidos(["", " "])).toEqual([]);
  });
});

describe("historicoInicial (pet novo e pet antigo)", () => {
  it("pet novo: nada respondido, um campo vazio em alergias e cirurgias", () => {
    const h = historicoInicial(undefined);
    expect(h.temAlergia).toBe(null);
    expect(h.alergias).toEqual([""]);
    expect(h.cirurgias).toEqual([""]);
    expect(h.temDoencasAnteriores).toBe(null);
    expect(h.observacoes).toBe("");
    expect(h.vacinas).toEqual([]);
  });

  it("pet com doenças anteriores salvas antes do Sim/Não abre com 'Sim' marcado", () => {
    const h = historicoInicial({ doencas_anteriores: ["Otite"] });
    expect(h.temDoencasAnteriores).toBe(true);
  });

  it("pet que respondeu Não continua com Não", () => {
    const h = historicoInicial({ tem_doencas_anteriores: false, tem_alergia: false });
    expect(h.temDoencasAnteriores).toBe(false);
    expect(h.temAlergia).toBe(false);
  });

  it("traz alergias, cirurgias e observações salvas", () => {
    const h = historicoInicial({
      tem_alergia: true,
      alergias: ["Frango"],
      cirurgias: ["Hérnia"],
      observacoes: "Tem medo de trovão.",
    });
    expect(h.alergias).toEqual(["Frango"]);
    expect(h.cirurgias).toEqual(["Hérnia"]);
    expect(h.observacoes).toBe("Tem medo de trovão.");
  });

  it("testes de FIV e FeLV vêm do banco; registro sem data é descartado", () => {
    const h = historicoInicial({
      testes_felinos: {
        fiv: { testado: true, registros: [{ resultado: "Negativo", data: "2026-09-10" }, { resultado: "Positivo" }] },
        felv: { testado: false, registros: [] },
      },
    });
    expect(h.testeFiv.registros).toHaveLength(1);
    expect(h.testeFelv.testado).toBe(false);
  });
});
