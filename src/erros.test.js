// Testes de src/erros.js: casos que ainda não tinham teste.
// (Os principais estão em testes/erros.test.js)
// Rodar: npm test
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mensagemDeErro } from "./erros.js";

// A função escreve o erro técnico no console (F12). Nos testes, silenciamos isso.
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("mensagemDeErro", () => {
  it("sem erro devolve texto vazio", () => {
    expect(mensagemDeErro(null)).toBe("");
    expect(mensagemDeErro(undefined)).toBe("");
  });

  it("guarda o erro técnico no console para investigar", () => {
    const erro = { message: "algo" };
    mensagemDeErro(erro);
    expect(console.error).toHaveBeenCalledWith(erro);
  });

  it("e-mail inválido pelo código", () => {
    expect(mensagemDeErro({ code: "email_address_invalid" })).toBe(
      "E-mail inválido. Confira se digitou certo."
    );
  });

  it("e-mail inválido pelo texto em inglês", () => {
    expect(mensagemDeErro({ message: "Unable to validate email address: invalid format" })).toBe(
      "E-mail inválido. Confira se digitou certo."
    );
  });

  it("senha fraca pelo texto em inglês", () => {
    expect(mensagemDeErro({ message: "Password should be at least 8 characters" })).toContain(
      "Senha fraca"
    );
  });

  it("muitas tentativas seguidas (rate limit)", () => {
    expect(mensagemDeErro({ code: "over_email_send_rate_limit" })).toBe(
      "Muitas tentativas seguidas. Espere alguns minutos e tente de novo."
    );
  });

  it("e-mail já cadastrado pelo código também não revela que existe", () => {
    expect(mensagemDeErro({ code: "user_already_exists" })).toBe(
      "Não foi possível criar a conta. Confira os dados e tente de novo."
    );
  });

  it("valor inválido no banco (23514)", () => {
    expect(mensagemDeErro({ code: "23514" })).toBe(
      "Algum campo está com valor inválido. Confira e tente de novo."
    );
  });

  it("sem permissão (42501)", () => {
    expect(mensagemDeErro({ code: "42501" })).toBe(
      "Você não tem permissão para fazer isso. Entre de novo na sua conta."
    );
  });

  it("'Failed to fetch' (sem internet) vira mensagem de conexão", () => {
    expect(mensagemDeErro({ message: "TypeError: Failed to fetch" })).toBe(
      "Sem conexão. Confira a internet e tente de novo."
    );
  });

  it("erro sem código nem mensagem cai na mensagem genérica", () => {
    expect(mensagemDeErro({})).toBe("Algo deu errado. Tente de novo.");
  });
});
