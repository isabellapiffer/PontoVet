// Vacinas que aparecem para marcar, conforme a espécie do pet.
// Usadas no RegistrarVacinas (perfil do pet) e no "+" da Agenda.
// Ficam num arquivo próprio porque arquivo de componente só exporta componentes.
export const VACINAS_POR_ESPECIE = {
  Canino: ["V10 (polivalente)", "V8 (polivalente)", "Giardiavax", "Gripes", "Raiva"],
  Felino: ["V3", "V4", "V5", "FeLV", "Raiva"],
};

// Outras espécies raramente vacinam; quando vacinam, é a da raiva
export const VACINAS_OUTRAS_ESPECIES = ["Raiva"];

// Nome guardado no banco: "V10 (polivalente)" vira "V10"
export function nomeDaVacina(opcao) {
  return opcao.replace(" (polivalente)", "");
}

// Grupos em que só dá para marcar UMA (marcar outra do grupo desmarca a anterior)
const SO_UMA_DO_GRUPO = {
  Canino: [["V10 (polivalente)", "V8 (polivalente)"]],
  Felino: [["V3", "V4", "V5"]],
};
// Pares que não podem ir juntos (a V5 já protege contra FeLV)
const NAO_PODEM_JUNTAS = {
  Felino: [["V5", "FeLV"]],
};

// Marca ou desmarca uma vacina, tirando as que não combinam com ela.
// Usada no perfil do pet (RegistrarVacinas) e no "+ Vacina > Agendar" da Agenda.
// Ex.: (["V10 (polivalente)", "Raiva"], "V8 (polivalente)", "Canino") -> ["Raiva", "V8 (polivalente)"]
export function alternarVacina(marcadas, opcao, especie) {
  if (marcadas.includes(opcao)) {
    return marcadas.filter((v) => v !== opcao);
  }

  // Tira as que não combinam com a nova
  const conflitos = new Set();
  for (const grupo of SO_UMA_DO_GRUPO[especie] || []) {
    if (grupo.includes(opcao)) grupo.forEach((v) => v !== opcao && conflitos.add(v));
  }
  for (const [a, b] of NAO_PODEM_JUNTAS[especie] || []) {
    if (opcao === a) conflitos.add(b);
    if (opcao === b) conflitos.add(a);
  }

  return [...marcadas.filter((v) => !conflitos.has(v)), opcao];
}

// Vacinas agendadas juntas viram um título só: ["V10", "Raiva"] -> "Vacina V10 + Raiva"
export function tituloDasVacinas(nomes) {
  return `Vacina ${nomes.join(" + ")}`;
}

// O contrário: "Vacina V10 + Raiva" -> ["V10", "Raiva"] (para o "Registrar aplicação")
export function vacinasDoTitulo(titulo) {
  return (titulo || "").replace(/^Vacina /, "").split(" + ").filter(Boolean);
}
