// Testes das regras da carteirinha de vacinação (src/carteirinha.js).
// Rodar: npm test
import { describe, it, expect } from "vitest";
import {
  erroArquivo,
  caminhoCarteirinha,
  linhasCarteirinha,
  pastaCarteirinha,
  tipoDoArquivo,
  linhasPendentes,
} from "./carteirinha.js";

const MB = 1024 * 1024;

describe("erroArquivo", () => {
  it("foto e PDF de até 10 MB passam", () => {
    expect(erroArquivo({ name: "carteirinha.jpg", type: "image/jpeg", size: 2 * MB }, 0)).toBe("");
    expect(erroArquivo({ name: "exame.pdf", type: "application/pdf", size: 10 * MB }, 3)).toBe("");
  });

  it("foto do iPhone (HEIC) passa mesmo quando o navegador não diz o tipo", () => {
    expect(erroArquivo({ name: "IMG_0001.HEIC", type: "", size: 3 * MB }, 0)).toBe("");
  });

  it("outro tipo de arquivo não passa", () => {
    expect(erroArquivo({ name: "planilha.xlsx", type: "application/vnd.ms-excel", size: MB }, 0)).toBe(
      "Envie uma foto ou um PDF."
    );
  });

  it("arquivo maior que 10 MB não passa", () => {
    expect(erroArquivo({ name: "grande.pdf", type: "application/pdf", size: 10 * MB + 1 }, 0)).toBe(
      "O arquivo passa de 10 MB. Envie um menor."
    );
  });

  it("já com 10 arquivos, não deixa anexar o 11º", () => {
    expect(erroArquivo({ name: "a.jpg", type: "image/jpeg", size: MB }, 10)).toBe(
      "Você já anexou 10 arquivos. Remova um para anexar outro."
    );
  });

  it("com 9 arquivos ainda deixa anexar o 10º", () => {
    expect(erroArquivo({ name: "a.jpg", type: "image/jpeg", size: MB }, 9)).toBe("");
  });
});

describe("tipoDoArquivo", () => {
  it("sem tipo informado: .heif vira image/heic; .png fica sem tipo", () => {
    expect(tipoDoArquivo({ name: "foto.heif", type: "" })).toBe("image/heic");
    expect(tipoDoArquivo({ name: "foto.png", type: "" })).toBe("");
  });

  it("o tipo informado pelo navegador vale mais que a extensão", () => {
    expect(tipoDoArquivo({ name: "foto.heif", type: "image/jpeg" })).toBe("image/jpeg");
  });
});

describe("pastaCarteirinha", () => {
  it("pasta do tutor, depois a do pet, depois carteirinha", () => {
    expect(pastaCarteirinha("tutor-1", "pet-hanna")).toBe("tutor-1/pet-hanna/carteirinha");
  });
});

describe("caminhoCarteirinha", () => {
  it("fica na pasta do tutor, dentro da pasta do pet, com nome aleatório e a extensão", () => {
    const caminho = caminhoCarteirinha("tutor-1", "pet-hanna", { name: "Foto Carteirinha.JPG", type: "image/jpeg" });
    expect(caminho).toMatch(/^tutor-1\/pet-hanna\/carteirinha\/[0-9a-f-]{36}\.jpg$/);
  });

  it("a extensão vem do tipo do arquivo, não do nome", () => {
    const semPonto = caminhoCarteirinha("t", "p", { name: "carteirinha da Hanna", type: "image/jpeg" });
    expect(semPonto).toMatch(/\.jpg$/);
    const pdf = caminhoCarteirinha("t", "p", { name: "x.PDF", type: "application/pdf" });
    expect(pdf).toMatch(/\.pdf$/);
  });

  it("dois anexos nunca têm o mesmo nome", () => {
    const arquivo = { name: "a.pdf", type: "application/pdf" };
    expect(caminhoCarteirinha("t", "p", arquivo)).not.toBe(caminhoCarteirinha("t", "p", arquivo));
  });
});

describe("linhasCarteirinha", () => {
  it("numera do mais antigo para o mais novo, com o tipo e a data", () => {
    const daPasta = [
      { name: "b.pdf", created_at: "2026-11-09T14:00:00Z", metadata: { mimetype: "application/pdf" } },
      { name: "a.jpg", created_at: "2026-11-05T10:00:00Z", metadata: { mimetype: "image/jpeg" } },
    ];
    expect(linhasCarteirinha(daPasta, "t/p/carteirinha")).toEqual([
      { nome: "Carteirinha 1", detalhe: "Foto · 05/11/2026", caminho: "t/p/carteirinha/a.jpg", pdf: false },
      { nome: "Carteirinha 2", detalhe: "PDF · 09/11/2026", caminho: "t/p/carteirinha/b.pdf", pdf: true },
    ]);
  });

  it("ignora o arquivo escondido que o Supabase cria em pasta vazia", () => {
    const daPasta = [{ name: ".emptyFolderPlaceholder", created_at: "2026-11-05T10:00:00Z", metadata: {} }];
    expect(linhasCarteirinha(daPasta, "t/p/carteirinha")).toEqual([]);
  });

  it("arquivo sem metadata aparece como Foto", () => {
    const daPasta = [{ name: "a.jpg", created_at: "2026-11-05T10:00:00Z" }];
    expect(linhasCarteirinha(daPasta, "t/p/carteirinha")[0].detalhe).toBe("Foto · 05/11/2026");
  });

  it("pasta sem nada: lista vazia", () => {
    expect(linhasCarteirinha([], "t/p/carteirinha")).toEqual([]);
    expect(linhasCarteirinha(null, "t/p/carteirinha")).toEqual([]);
  });
});

// Cadastro de pet novo: os arquivos ficam esperando o "Salvar pet"
describe("linhasPendentes", () => {
  it("numera na ordem em que foram escolhidos e diz que sobem ao salvar", () => {
    const pendentes = [
      { name: "carteirinha da Hanna.jpg", type: "image/jpeg" },
      { name: "vacinas.pdf", type: "application/pdf" },
    ];
    expect(linhasPendentes(pendentes)).toEqual([
      { nome: "Carteirinha 1", detalhe: "Foto · enviada ao salvar o pet", pdf: false, indice: 0 },
      { nome: "Carteirinha 2", detalhe: "PDF · enviada ao salvar o pet", pdf: true, indice: 1 },
    ]);
  });

  it("foto do iPhone sem tipo informado aparece como Foto", () => {
    expect(linhasPendentes([{ name: "IMG_0001.HEIC", type: "" }])[0].detalhe).toBe(
      "Foto · enviada ao salvar o pet"
    );
  });

  it("nenhum arquivo escolhido: lista vazia", () => {
    expect(linhasPendentes([])).toEqual([]);
  });
});
