// Testes de src/fotos.js: escolher a foto do pet ou do perfil.
// Rodar: npm test
import { describe, it, expect, vi, afterEach } from "vitest";

// A conversão de foto do iPhone (HEIC) é FALSA aqui: não baixa a biblioteca de verdade.
vi.mock("heic2any", () => ({
  default: vi.fn(async () => new Blob(["jpeg"], { type: "image/jpeg" })),
}));

import { abrirFotoEscolhida, AVISO_FOTO } from "./fotos.js";

afterEach(() => vi.restoreAllMocks());

describe("abrirFotoEscolhida", () => {
  it("o aviso para foto que não abre é o do TESTES.md", () => {
    expect(AVISO_FOTO).toBe("Não consegui abrir essa foto. Tente outra.");
  });

  it("recusa arquivo que não é foto (PDF)", async () => {
    const pdf = new File(["x"], "receita.pdf", { type: "application/pdf" });
    await expect(abrirFotoEscolhida(pdf)).rejects.toThrow("Esse arquivo não é uma foto.");
  });

  it("recusa arquivo sem tipo e sem extensão de foto", async () => {
    const texto = new File(["x"], "anotacoes.txt", { type: "" });
    await expect(abrirFotoEscolhida(texto)).rejects.toThrow("não é uma foto");
  });

  it("aceita foto JPEG e devolve o endereço para a tela de ajustar", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:foto-da-hanna");
    const foto = new File(["x"], "hanna.jpg", { type: "image/jpeg" });
    await expect(abrirFotoEscolhida(foto)).resolves.toBe("blob:foto-da-hanna");
  });

  it("aceita foto do iPhone (HEIC) e converte para JPEG", async () => {
    const criar = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:convertida");
    const heic = new File(["x"], "IMG_0001.HEIC", { type: "image/heic" });
    await expect(abrirFotoEscolhida(heic)).resolves.toBe("blob:convertida");
    // o que foi mostrado é o JPEG convertido, não o arquivo original
    expect(criar.mock.calls[0][0].type).toBe("image/jpeg");
  });

  it("reconhece HEIC pela extensão quando o navegador não informa o tipo", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:convertida");
    const heic = new File(["x"], "IMG_0002.heic", { type: "" });
    await expect(abrirFotoEscolhida(heic)).resolves.toBe("blob:convertida");
  });
});
