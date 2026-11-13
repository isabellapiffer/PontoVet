// Testes automáticos das mensagens de erro em português. Rodar: npm test
import { describe, it, expect, vi } from "vitest";
import { mensagemDeErro } from "../src/erros.js";

// O erro técnico vai para o console; aqui não precisa aparecer
vi.spyOn(console, "error").mockImplementation(() => {});

describe("Mensagens de erro", () => {
  it("e-mail que já tem conta: não conta que o e-mail existe", () => {
    const mensagem = mensagemDeErro({ code: "user_already_exists", message: "User already registered" });
    expect(mensagem).toContain("Não foi possível criar a conta");
    expect(mensagem).not.toContain("já tem conta");
  });

  it("senha fraca", () => {
    expect(mensagemDeErro({ code: "weak_password" })).toContain("Senha fraca");
  });

  it("CPF repetido no banco", () => {
    expect(mensagemDeErro({ code: "23505", message: "duplicate key value" })).toContain("já existe");
  });

  it("sem internet", () => {
    expect(mensagemDeErro({ message: "Failed to fetch" })).toContain("Sem conexão");
  });

  it("erro desconhecido nunca aparece em inglês", () => {
    expect(mensagemDeErro({ message: "Something weird" })).toBe("Algo deu errado. Tente de novo.");
  });
});
