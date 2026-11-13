import { hojeISO } from "./lembretes.js";

export const UNIDADES_PESO = ["kg", "g"];

// O peso mais recente do pet (ou null)
export function ultimoPeso(pesos) {
  if (!pesos?.length) return null;
  return [...pesos].sort((a, b) => b.data.localeCompare(a.data))[0];
}

// No perfil do pet: "4,2 kg"
export function textoPeso(pesos) {
  const ultimo = ultimoPeso(pesos);
  if (!ultimo) return "Não informado";
  return `${ultimo.peso.toLocaleString("pt-BR")} ${ultimo.unidade}`;
}

// "4,2" → 4.2 (vazio ou zero → null)
export function pesoDigitado(texto) {
  const numero = Number(texto.replace(",", "."));
  return texto && Number.isFinite(numero) && numero > 0 ? numero : null;
}

// O tutor só vê um campo, mas o banco guarda cada peso com a data
// (para o veterinário acompanhar depois). Peso igual ao último: não muda nada.
// Peso novo: entra com a data de hoje (se já tinha um de hoje, troca).
export function pesosParaSalvar(pesos, peso, unidade) {
  const ultimo = ultimoPeso(pesos);
  if (ultimo && ultimo.peso === peso && ultimo.unidade === unidade) return pesos;

  const hoje = hojeISO();
  return [
    ...pesos.filter((registro) => registro.data !== hoje),
    { peso, unidade, data: hoje, autor: "tutor" },
  ];
}
