// Testes de src/dados.js: os 25 profissionais fictícios do Buscar.
// Rodar: npm test
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { vets } from "./dados.js";
import { cidadesSC } from "./cidadesSC.js";

// A mesma lista do filtro "Qual especialidade?" do Buscar (src/paginas/Mural.jsx/Mural.jsx)
const ESPECIALIDADES_DO_FILTRO = [
  "Clínico Geral",
  "Cardiologista",
  "Dermatologista",
  "Felinos",
  "Gastroenterologista",
  "Imagem",
  "Nefrologista",
  "Neurologista",
  "Nutrólogo/Nutricionista",
  "Oftalmologista",
  "Oncologista",
  "Ortopedista",
  "Silvestres",
  "Grandes Animais",
];

describe("profissionais fictícios", () => {
  it("são 25, com id diferente cada um", () => {
    expect(vets).toHaveLength(25);
    expect(new Set(vets.map((vet) => vet.id)).size).toBe(25);
  });

  it("o card de teste da Isabella saiu e nenhum nome tem '(fake)' (o aviso fica na faixa)", () => {
    for (const vet of vets) {
      expect(vet.nome).not.toContain("Isabella");
      expect(vet.nome).not.toContain("(fake)");
    }
  });

  it("todas as cidades existem na lista oficial de SC, e são 15 cidades diferentes", () => {
    for (const vet of vets) {
      expect(cidadesSC, vet.nome).toContain(vet.cidade);
    }
    expect(new Set(vets.map((vet) => vet.cidade)).size).toBe(15);
  });

  it("a especialidade está escrita igual à lista do filtro, e todas as 14 aparecem", () => {
    for (const vet of vets) {
      expect(ESPECIALIDADES_DO_FILTRO, vet.nome).toContain(vet.especialidade);
    }
    expect(new Set(vets.map((vet) => vet.especialidade)).size).toBe(14);
  });

  it("cada foto existe na pasta public/fotos-fake e nenhuma se repete", () => {
    // readdirSync devolve os nomes exatos, com maiúsculas e minúsculas. O Windows não
    // diferencia "Pexels-1.jpg" de "pexels-1.jpg", mas o servidor da Vercel diferencia
    const arquivos = readdirSync("public/fotos-fake");
    for (const vet of vets) {
      expect(vet.foto, vet.nome).toMatch(/^\/fotos-fake\/pexels-\d+\.jpg$/);
      expect(arquivos, vet.foto).toContain(vet.foto.replace("/fotos-fake/", ""));
    }
    expect(new Set(vets.map((vet) => vet.foto)).size).toBe(25);
  });

  it("cada foto tem o crédito do Pexels anotado no CREDITOS.md", () => {
    const creditos = readFileSync("public/fotos-fake/CREDITOS.md", "utf-8");
    for (const vet of vets) {
      const numero = vet.foto.match(/\d+/)[0];
      expect(creditos, vet.foto).toContain(`https://www.pexels.com/photo/${numero}/`);
    }
  });

  it("3 profissionais sem avaliação aparecem como 'Novo' (nota null)", () => {
    const novos = vets.filter((vet) => vet.avaliacoes.length === 0);
    expect(novos).toHaveLength(3);
    for (const vet of novos) {
      expect(vet.nota, vet.nome).toBe(null);
    }
  });

  it("a nota é a média das avaliações, arredondada para uma casa", () => {
    // As notas são múltiplos de 0,5, então as médias (ex.: 4,75 e 4,25) cabem exatas
    // no computador e Math.round(47,5) dá 48 -> 4,8, sem erro de arredondamento
    for (const vet of vets.filter((v) => v.avaliacoes.length > 0)) {
      const media = vet.avaliacoes.reduce((soma, a) => soma + a.nota, 0) / vet.avaliacoes.length;
      expect(vet.nota, vet.nome).toBe(Math.round(media * 10) / 10);
    }
  });

  it("toda avaliação tem autor, nota de 1 a 5, comentário, data, atendimento e pet", () => {
    for (const vet of vets) {
      for (const avaliacao of vet.avaliacoes) {
        expect(avaliacao).toEqual(
          expect.objectContaining({
            autor: expect.any(String),
            nota: expect.any(Number),
            comentario: expect.any(String),
            data: expect.stringMatching(/^\d{2}\/\d{2}\/2026$/),
            atendimento: expect.any(String),
            pet: expect.any(String),
          })
        );
        expect(avaliacao.nota).toBeGreaterThanOrEqual(1);
        expect(avaliacao.nota).toBeLessThanOrEqual(5);
      }
    }
  });
});
