import { describe, it, expect, vi, beforeEach } from "vitest";

// O distancia.js importa o Supabase. Aqui ele é FALSO: nenhum pedido sai de verdade.
const falso = vi.hoisted(() => ({
  user: null,
  tutor: null,
}));

vi.mock("./supabaseClient.js", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: falso.user } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: falso.tutor }),
        }),
      }),
    }),
  },
}));

import {
  nomeOficialCidade,
  distanciaKm,
  textoDistancia,
  cidadeDoUsuario,
} from "./distancia.js";

describe("nomeOficialCidade", () => {
  it("acha o nome oficial sem acento e em minúsculas", () => {
    expect(nomeOficialCidade("balneario camboriu")).toBe("Balneário Camboriú");
  });

  it("acha o nome oficial em maiúsculas", () => {
    expect(nomeOficialCidade("ITAJAÍ")).toBe("Itajaí");
  });

  it("devolve null para cidade fora de SC", () => {
    expect(nomeOficialCidade("São Paulo")).toBeNull();
  });

  it("devolve null quando a cidade está vazia ou não existe", () => {
    expect(nomeOficialCidade("")).toBeNull();
    expect(nomeOficialCidade(null)).toBeNull();
    expect(nomeOficialCidade(undefined)).toBeNull();
  });

  it("não confunde Itá com Itajaí", () => {
    expect(nomeOficialCidade("Itá")).toBe("Itá");
  });
});

describe("distanciaKm", () => {
  it("dá 0 km de uma cidade para ela mesma", () => {
    expect(distanciaKm("Itajaí", "Itajaí")).toBe(0);
  });

  it("dá cerca de 10 km entre Balneário Camboriú e Itajaí", () => {
    const km = distanciaKm("Balneário Camboriú", "Itajaí");
    expect(km).toBeGreaterThan(8);
    expect(km).toBeLessThan(12);
  });

  it("dá o mesmo valor nos dois sentidos", () => {
    expect(distanciaKm("Blumenau", "Itapema")).toBeCloseTo(
      distanciaKm("Itapema", "Blumenau"),
      6
    );
  });

  it("ignora acento e maiúscula nos nomes", () => {
    expect(distanciaKm("itajai", "BLUMENAU")).toBeCloseTo(
      distanciaKm("Itajaí", "Blumenau"),
      6
    );
  });

  it("cidade mais longe dá número maior (Blumenau está mais longe de Itapema que Itajaí)", () => {
    expect(distanciaKm("Itapema", "Blumenau")).toBeGreaterThan(
      distanciaKm("Itapema", "Itajaí")
    );
  });

  it("devolve null se uma das cidades não é de SC", () => {
    expect(distanciaKm("Itajaí", "São Paulo")).toBeNull();
    expect(distanciaKm("São Paulo", "Itajaí")).toBeNull();
  });

  it("devolve null se a cidade está vazia", () => {
    expect(distanciaKm("", "Itajaí")).toBeNull();
    expect(distanciaKm("Itajaí", null)).toBeNull();
  });
});

describe("textoDistancia", () => {
  it("12.3 vira '12 km'", () => {
    expect(textoDistancia(12.3)).toBe("12 km");
  });

  it("arredonda para cima (12.6 vira '13 km')", () => {
    expect(textoDistancia(12.6)).toBe("13 km");
  });

  it("1 km exato ainda aparece", () => {
    expect(textoDistancia(1)).toBe("1 km");
  });

  it("menos de 1 km (mesma cidade) não mostra nada", () => {
    expect(textoDistancia(0)).toBeNull();
    expect(textoDistancia(0.9)).toBeNull();
  });

  it("distância desconhecida (null) não mostra nada", () => {
    expect(textoDistancia(null)).toBeNull();
  });
});

describe("cidadeDoUsuario", () => {
  beforeEach(() => {
    falso.user = null;
    falso.tutor = null;
    // sessionStorage falso, para simular o endereço escolhido na gaveta
    const guardado = {};
    vi.stubGlobal("sessionStorage", {
      getItem: (chave) => guardado[chave] ?? null,
      setItem: (chave, valor) => {
        guardado[chave] = valor;
      },
    });
  });

  it("usa a cidade do endereço escolhido na gaveta", async () => {
    sessionStorage.setItem("enderecoEscolhido", "Rua X, 10 - Itajaí, SC");
    expect(await cidadeDoUsuario()).toBe("Itajaí");
  });

  it("fica com a cidade de nome mais comprido (Balneário Camboriú, não Camboriú)", async () => {
    sessionStorage.setItem(
      "enderecoEscolhido",
      "Rua Exemplo, 100 - Centro, Balneário Camboriú"
    );
    expect(await cidadeDoUsuario()).toBe("Balneário Camboriú");
  });

  it("não acha Itá dentro de Itajaí", async () => {
    sessionStorage.setItem("enderecoEscolhido", "Rua Y - Itajaí");
    expect(await cidadeDoUsuario()).not.toBe("Itá");
  });

  it("sem endereço escolhido e sem login devolve null", async () => {
    expect(await cidadeDoUsuario()).toBeNull();
  });

  it("sem endereço escolhido usa a cidade do cadastro do tutor", async () => {
    falso.user = { id: "tutor-1" };
    falso.tutor = { cidade: "blumenau" };
    expect(await cidadeDoUsuario()).toBe("Blumenau");
  });

  it("endereço fora de SC cai para a cidade do cadastro", async () => {
    sessionStorage.setItem("enderecoEscolhido", "Av. Paulista, 1000 - São Paulo");
    falso.user = { id: "tutor-1" };
    falso.tutor = { cidade: "Brusque" };
    expect(await cidadeDoUsuario()).toBe("Brusque");
  });

  it("tutor com cidade fora de SC devolve null", async () => {
    falso.user = { id: "tutor-1" };
    falso.tutor = { cidade: "Curitiba" };
    expect(await cidadeDoUsuario()).toBeNull();
  });
});
