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
