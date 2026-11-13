// Regras da carteirinha de vacinação (fotos e PDFs na pasta privada documentos-pets).
// A tela fica em src/componentes/Carteirinha.jsx.

export const PASTA_DOCUMENTOS = "documentos-pets";
const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
const LIMITE_BYTES = 10 * 1024 * 1024; // 10 MB, igual ao limite da pasta no Supabase
export const LIMITE_ARQUIVOS = 10;

// Alguns navegadores não dizem o tipo da foto do iPhone: descobre pela extensão
export function tipoDoArquivo(arquivo) {
  if (arquivo.type) return arquivo.type;
  return /\.(heic|heif)$/i.test(arquivo.name) ? "image/heic" : "";
}

// "" = pode anexar; senão, o aviso que aparece embaixo do botão
export function erroArquivo(arquivo, quantidadeAtual) {
  if (quantidadeAtual >= LIMITE_ARQUIVOS) {
    return `Você já anexou ${LIMITE_ARQUIVOS} arquivos. Remova um para anexar outro.`;
  }
  if (!TIPOS_ACEITOS.includes(tipoDoArquivo(arquivo))) return "Envie uma foto ou um PDF.";
  if (arquivo.size > LIMITE_BYTES) return "O arquivo passa de 10 MB. Envie um menor.";
  return "";
}

// Pasta do pet: <id do tutor>/<id do pet>/carteirinha
// (a 1ª pasta é o id do tutor: é ela que a regra do Supabase confere)
export function pastaCarteirinha(tutorId, petId) {
  return `${tutorId}/${petId}/carteirinha`;
}

// Extensão de cada tipo aceito (o nome do arquivo pode não ter extensão)
const EXTENSOES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

// Nome aleatório: não guarda o nome original (que pode ter dados pessoais)
export function caminhoCarteirinha(tutorId, petId, arquivo) {
  const extensao = EXTENSOES[tipoDoArquivo(arquivo)];
  return `${pastaCarteirinha(tutorId, petId)}/${crypto.randomUUID()}.${extensao}`;
}

// Lista da pasta (supabase.storage.list) -> linhas da tela:
// { nome: "Carteirinha 1", detalhe: "Foto · 05/11/2026", caminho, pdf }
export function linhasCarteirinha(daPasta, pasta) {
  return (daPasta || [])
    .filter((item) => !item.name.startsWith(".")) // arquivo escondido de pasta vazia
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((item, indice) => {
      const pdf = item.metadata?.mimetype === "application/pdf";
      const data = new Date(item.created_at).toLocaleDateString("pt-BR");
      return {
        nome: `Carteirinha ${indice + 1}`,
        detalhe: `${pdf ? "PDF" : "Foto"} · ${data}`,
        caminho: `${pasta}/${item.name}`,
        pdf,
      };
    });
}

// Cadastro de pet novo: arquivos escolhidos que só sobem ao salvar o pet -> linhas da tela.
// indice: a posição na lista, para a lixeira saber qual tirar
export function linhasPendentes(pendentes) {
  return pendentes.map((arquivo, indice) => {
    const pdf = tipoDoArquivo(arquivo) === "application/pdf";
    return {
      nome: `Carteirinha ${indice + 1}`,
      detalhe: `${pdf ? "PDF" : "Foto"} · enviada ao salvar o pet`,
      pdf,
      indice,
    };
  });
}
