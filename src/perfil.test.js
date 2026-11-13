// Testes de src/perfil.js: confere se a pessoa logada já tem cadastro.
// Rodar: npm test
import { describe, it, expect, vi, beforeEach } from "vitest";

// O Supabase é FALSO aqui. "tabelas" diz qual linha existe em cada tabela.
const falso = vi.hoisted(() => ({ tabelas: {} }));

vi.mock("./supabaseClient.js", () => ({
  supabase: {
    from: (tabela) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: falso.tabelas[tabela] ?? null }),
        }),
      }),
    }),
  },
}));

import { temCadastro, linkCompletarCadastro } from "./perfil.js";

beforeEach(() => {
  falso.tabelas = {};
});

describe("temCadastro", () => {
  it("tutor com perfil na tabela tutores: tem cadastro", async () => {
    falso.tabelas.tutores = { id: "abc" };
    expect(await temCadastro("abc")).toBe(true);
  });

  it("profissional com perfil na tabela profissionais: tem cadastro", async () => {
    falso.tabelas.profissionais = { id: "abc" };
    expect(await temCadastro("abc")).toBe(true);
  });

  it("só tem login (e-mail e senha), sem perfil em nenhuma tabela: não tem cadastro", async () => {
    expect(await temCadastro("abc")).toBe(false);
  });
});

describe("linkCompletarCadastro", () => {
  it("manda para a tela de completar cadastro guardando para onde voltar", () => {
    expect(linkCompletarCadastro("/meus-animais")).toBe(
      "/completar-cadastro?voltar=%2Fmeus-animais"
    );
  });

  it("protege endereços com & e ? para não quebrar o link", () => {
    expect(linkCompletarCadastro("/buscar?a=1&b=2")).toBe(
      "/completar-cadastro?voltar=%2Fbuscar%3Fa%3D1%26b%3D2"
    );
  });
});
