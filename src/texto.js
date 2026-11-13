// Para comparar sem diferença de maiúscula e acento: "Não" e "nao" ficam iguais
// (o NFD separa a letra do acento, e o \p{Diacritic} tira os acentos)
export function semAcento(texto) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
