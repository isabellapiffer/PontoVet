import { supabase } from "./supabaseClient.js";
import { cidadesSC, coordenadasSC } from "./cidadesSC.js";
import { semAcento } from "./texto.js";

// Acha o nome oficial da cidade de SC, sem ligar para acento e maiúscula
// ("balneario camboriu" -> "Balneário Camboriú"). Fora de SC: null
export function nomeOficialCidade(cidade) {
  if (!cidade) return null;
  return cidadesSC.find((c) => semAcento(c) === semAcento(cidade)) || null;
}

// Distância em km, em linha reta, entre o centro de duas cidades de SC.
// Usa a fórmula de Haversine (conta a curva da Terra). Cidade desconhecida: null
export function distanciaKm(cidadeA, cidadeB) {
  const a = coordenadasSC[nomeOficialCidade(cidadeA)];
  const b = coordenadasSC[nomeOficialCidade(cidadeB)];
  if (!a || !b) return null;

  const raioTerra = 6371; // km
  const emRadianos = (graus) => (graus * Math.PI) / 180;
  const difLat = emRadianos(b[0] - a[0]);
  const difLon = emRadianos(b[1] - a[1]);
  const h =
    Math.sin(difLat / 2) ** 2 +
    Math.cos(emRadianos(a[0])) *
      Math.cos(emRadianos(b[0])) *
      Math.sin(difLon / 2) ** 2;

  return 2 * raioTerra * Math.asin(Math.sqrt(h));
}

// 12,3 -> "12 km". Mesma cidade (menos de 1 km) ou desconhecida: null (não mostra)
export function textoDistancia(km) {
  if (km === null || km < 1) return null;
  return `${Math.round(km)} km`;
}

// Procura uma cidade de SC dentro de um texto de endereço
// ("Rua X, 10 - Itajaí" -> "Itajaí"). Se achar mais de uma, fica com a
// de nome mais comprido ("Balneário Camboriú" ganha de "Camboriú")
function cidadeNoTexto(texto) {
  if (!texto) return null;
  const textoLimpo = ` ${semAcento(texto).replace(/[^a-z0-9]+/g, " ")} `;

  const achadas = cidadesSC.filter((cidade) => {
    const nomeLimpo = semAcento(cidade).replace(/[^a-z0-9]+/g, " ");
    // os espaços dos lados evitam achar "Itá" dentro de "Itajaí"
    return textoLimpo.includes(` ${nomeLimpo} `);
  });

  achadas.sort((a, b) => b.length - a.length);
  return achadas[0] || null;
}

// Cidade de onde o usuário está buscando:
// 1º o endereço escolhido na gaveta da tela inicial (se tiver uma cidade de SC)
// 2º a cidade do cadastro do tutor
// Não logado ou fora de SC: null
export async function cidadeDoUsuario() {
  try {
    const escolhida = cidadeNoTexto(sessionStorage.getItem("enderecoEscolhido"));
    if (escolhida) return escolhida;
  } catch {
    // navegador sem sessionStorage: segue para o cadastro
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tutor } = await supabase
    .from("tutores")
    .select("cidade")
    .eq("id", user.id)
    .maybeSingle();

  return nomeOficialCidade(tutor?.cidade);
}
