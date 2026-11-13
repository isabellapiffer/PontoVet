// 4.9 vira "4,9" (com vírgula, como no Brasil). Sem nota: "Novo"
// Fica num arquivo próprio (e não no Mural.jsx) porque arquivos de
// componente só devem exportar componentes (regra do React/Vite)
export function formatarNota(nota) {
  return nota ? nota.toFixed(1).replace(".", ",") : "Novo";
}
