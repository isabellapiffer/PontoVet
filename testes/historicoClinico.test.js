// Testes automáticos das doenças e medicações do Histórico clínico. Rodar: npm test
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  doencasPreenchidas,
  textoDoenca,
  erroNasDatasDoencas,
  medicacoesDasDoencas,
  historicoInicial,
} from "../src/componentes/HistoricoClinico.jsx";

afterEach(() => vi.useRealTimers());

// Uma doença como fica na tela (com o id só da tela)
function doenca(campos) {
  return { id: "x", doenca: "", medicamentos: [""], diagnostico: "", ...campos };
}

describe("Doenças", () => {
  it("resumo: Diabetes · 08/2026", () => {
    expect(textoDoenca({ doenca: "Diabetes", diagnostico: "2026-08" })).toBe("Diabetes · 08/2026");
  });

  it("resumo das anteriores com medicamento: Otite (Otogard)", () => {
    expect(textoDoenca({ doenca: "Otite", medicamentos: ["Otogard"] })).toBe("Otite (Otogard)");
  });

  it("cartão em branco não é salvo", () => {
    const salvas = doencasPreenchidas([doenca({ doenca: "Diabetes" }), doenca({})]);
    expect(salvas).toHaveLength(1);
  });

  it("data pela metade não vai para o banco", () => {
    const [salva] = doencasPreenchidas([doenca({ doenca: "Diabetes", diagnostico: "08" })]);
    expect(salva.diagnostico).toBe(null);
  });

  it("data do diagnóstico no futuro dá erro", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 27));
    expect(erroNasDatasDoencas([doenca({ doenca: "Diabetes", diagnostico: "12/2030" })])).toContain(
      "futuro"
    );
    expect(erroNasDatasDoencas([doenca({ doenca: "Diabetes", diagnostico: "08/2026" })])).toBe("");
  });
});

describe("Medicação dentro da doença", () => {
  it("cada medicação leva o nome da doença", () => {
    const lista = [
      doenca({ doenca: "Diabetes", temMedicacao: true, medicacoes: [{ nome: "Insulina" }] }),
      doenca({ doenca: "Osteoartrite", temMedicacao: false, medicacoes: [{ nome: "Meloxicam" }] }),
    ];
    // Osteoartrite marcou Não: o Meloxicam não vai
    expect(medicacoesDasDoencas(lista)).toEqual([{ nome: "Insulina", doenca: "Diabetes" }]);
  });

  it("ao abrir o pet, cada remédio volta para a sua doença", () => {
    const pet = {
      tem_doencas_em_tratamento: true,
      doencas_em_tratamento: [
        { doenca: "Diabetes", diagnostico: "2026-08", temMedicacao: true },
        { doenca: "Osteoartrite", diagnostico: null, temMedicacao: null },
      ],
      medicacoes: [
        { nome: "Insulina", doenca: "Diabetes" },
        { nome: "Remédio antigo sem doença" },
      ],
    };
    const [diabetes, osteoartrite] = historicoInicial(pet).doencasEmTratamento;
    expect(diabetes.medicacoes.map((med) => med.nome)).toEqual(["Insulina"]);
    expect(diabetes.diagnostico).toBe("08/2026");
    expect(osteoartrite.medicacoes).toEqual([]);
  });
});
