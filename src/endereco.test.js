import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ufs,
  paises,
  listaDeCidades,
  filtrarCidades,
  buscarCep,
  AVISO_CEP_NAO_ENCONTRADO,
  AVISO_CEP_FALHOU,
} from "./endereco.js";
import { cidadesPorEstado } from "./cidadesBrasil.js";

const todasAsCidades = listaDeCidades(cidadesPorEstado);

describe("listas de estados e países", () => {
  it("tem as 27 siglas, sem repetir", () => {
    expect(ufs).toHaveLength(27);
    expect(new Set(ufs).size).toBe(27);
  });

  it("tem 195 países, começando pelo Brasil e sem repetir", () => {
    expect(paises).toHaveLength(195);
    expect(paises[0]).toBe("Brasil");
    expect(new Set(paises).size).toBe(195);
  });
});

describe("listaDeCidades", () => {
  it("junta as cidades de todos os estados", () => {
    expect(todasAsCidades.length).toBeGreaterThan(5500);
  });

  it("monta o texto 'Cidade - UF' de Balneário Camboriú", () => {
    const cidade = todasAsCidades.find((c) => c.nome === "Balneário Camboriú");
    expect(cidade).toMatchObject({ uf: "SC", texto: "Balneário Camboriú - SC" });
  });
});

describe("filtrarCidades", () => {
  it("'sao pa' mostra São Paulo - SP entre as 10 primeiras (as que aparecem na tela)", () => {
    const textos = filtrarCidades(todasAsCidades, "sao pa").slice(0, 10).map((c) => c.texto);
    expect(textos).toContain("São Paulo - SP");
    // Em ordem alfabética, "São Patrício - GO" vem antes
    expect(textos[0]).toBe("São Patrício - GO");
  });

  it("não liga para maiúscula e acento: 'BALNEARIO CAMBORIU' acha Balneário Camboriú", () => {
    const resultado = filtrarCidades(todasAsCidades, "BALNEARIO CAMBORIU");
    expect(resultado.map((c) => c.texto)).toEqual(["Balneário Camboriú - SC"]);
  });

  it("acha pelo meio do nome, depois das que começam com o texto", () => {
    const textos = filtrarCidades(todasAsCidades, "camboriu").map((c) => c.texto);
    expect(textos[0]).toBe("Camboriú - SC");
    expect(textos).toContain("Balneário Camboriú - SC");
  });

  it("campo vazio ou só com espaços não mostra nada", () => {
    expect(filtrarCidades(todasAsCidades, "")).toEqual([]);
    expect(filtrarCidades(todasAsCidades, "   ")).toEqual([]);
  });
});

describe("buscarCep", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devolve rua, cidade e estado quando o ViaCEP acha o CEP", async () => {
    vi.stubGlobal("fetch", async () => ({
      json: async () => ({ logradouro: "Avenida Brasil", localidade: "Balneário Camboriú", uf: "SC" }),
    }));
    expect(await buscarCep("88330-000")).toEqual({
      rua: "Avenida Brasil",
      cidade: "Balneário Camboriú",
      estado: "SC",
    });
  });

  it("avisa 'CEP não encontrado.' quando o ViaCEP responde { erro: true }", async () => {
    vi.stubGlobal("fetch", async () => ({ json: async () => ({ erro: true }) }));
    expect(await buscarCep("99999-999")).toEqual({ aviso: AVISO_CEP_NAO_ENCONTRADO });
  });

  it("avisa para preencher à mão quando a busca falha (sem internet)", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("Failed to fetch");
    });
    expect(await buscarCep("88330-000")).toEqual({ aviso: AVISO_CEP_FALHOU });
  });
});
