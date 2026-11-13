import { describe, it, expect } from "vitest";
import { semAcento } from "./texto.js";

describe("semAcento", () => {
  it("tira o acento de uma cidade (Itajaí vira itajai)", () => {
    expect(semAcento("Itajaí")).toBe("itajai");
  });

  it("tira acentos e cedilha de várias letras (Balneário Camboriú)", () => {
    expect(semAcento("Balneário Camboriú")).toBe("balneario camboriu");
  });

  it("troca maiúsculas por minúsculas", () => {
    expect(semAcento("BLUMENAU")).toBe("blumenau");
  });

  it("deixa 'Não' e 'nao' iguais, que é o motivo da função existir", () => {
    expect(semAcento("Não")).toBe(semAcento("nao"));
  });

  it("não mexe em texto que já está sem acento", () => {
    expect(semAcento("brusque")).toBe("brusque");
  });

  it("mantém espaços e números", () => {
    expect(semAcento("Rua Exemplo, 100")).toBe("rua exemplo, 100");
  });

  it("devolve texto vazio quando recebe texto vazio", () => {
    expect(semAcento("")).toBe("");
  });
});
