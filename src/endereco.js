import { semAcento } from "./texto.js";

// Listas e funções dos campos de endereço (ver CamposEndereco).
// As siglas também são usadas no "Estado de emissão (UF)" do CRMV.
export const ufs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

// Os 195 países (193 da ONU, Vaticano e Palestina), em ordem alfabética,
// com o Brasil primeiro porque é o que quase todo mundo vai escolher.
export const paises = [
  "Brasil",
  "Afeganistão", "África do Sul", "Albânia", "Alemanha", "Andorra", "Angola",
  "Antígua e Barbuda", "Arábia Saudita", "Argélia", "Argentina", "Armênia",
  "Austrália", "Áustria", "Azerbaijão", "Bahamas", "Bangladesh", "Barbados",
  "Barein", "Bélgica", "Belize", "Benin", "Bielorrússia", "Bolívia",
  "Bósnia e Herzegovina", "Botsuana", "Brunei", "Bulgária", "Burquina Faso",
  "Burundi", "Butão", "Cabo Verde", "Camarões", "Camboja", "Canadá", "Catar",
  "Cazaquistão", "Chade", "Chile", "China", "Chipre", "Colômbia", "Comores",
  "Coreia do Norte", "Coreia do Sul", "Costa do Marfim", "Costa Rica",
  "Croácia", "Cuba", "Dinamarca", "Djibuti", "Dominica", "Egito",
  "El Salvador", "Emirados Árabes Unidos", "Equador", "Eritreia", "Eslováquia",
  "Eslovênia", "Espanha", "Essuatíni", "Estados Unidos", "Estônia", "Etiópia",
  "Fiji", "Filipinas", "Finlândia", "França", "Gabão", "Gâmbia", "Gana",
  "Geórgia", "Granada", "Grécia", "Guatemala", "Guiana", "Guiné",
  "Guiné Equatorial", "Guiné-Bissau", "Haiti", "Honduras", "Hungria", "Iêmen",
  "Ilhas Marshall", "Ilhas Salomão", "Índia", "Indonésia", "Irã", "Iraque",
  "Irlanda", "Islândia", "Israel", "Itália", "Jamaica", "Japão", "Jordânia",
  "Kuwait", "Laos", "Lesoto", "Letônia", "Líbano", "Libéria", "Líbia",
  "Liechtenstein", "Lituânia", "Luxemburgo", "Macedônia do Norte",
  "Madagascar", "Malásia", "Malaui", "Maldivas", "Mali", "Malta", "Marrocos",
  "Maurício", "Mauritânia", "México", "Mianmar", "Micronésia", "Moçambique",
  "Moldávia", "Mônaco", "Mongólia", "Montenegro", "Namíbia", "Nauru", "Nepal",
  "Nicarágua", "Níger", "Nigéria", "Noruega", "Nova Zelândia", "Omã",
  "Países Baixos", "Palau", "Palestina", "Panamá", "Papua-Nova Guiné",
  "Paquistão", "Paraguai", "Peru", "Polônia", "Portugal", "Quênia",
  "Quirguistão", "Quiribati", "Reino Unido", "República Centro-Africana",
  "República Democrática do Congo", "República do Congo",
  "República Dominicana", "Romênia", "Ruanda", "Rússia", "Samoa", "San Marino",
  "Santa Lúcia", "São Cristóvão e Névis", "São Tomé e Príncipe",
  "São Vicente e Granadinas", "Seicheles", "Senegal", "Serra Leoa", "Sérvia",
  "Singapura", "Síria", "Somália", "Sri Lanka", "Sudão", "Sudão do Sul",
  "Suécia", "Suíça", "Suriname", "Tadjiquistão", "Tailândia", "Tanzânia",
  "Tchéquia", "Timor-Leste", "Togo", "Tonga", "Trinidad e Tobago", "Tunísia",
  "Turcomenistão", "Turquia", "Tuvalu", "Ucrânia", "Uganda", "Uruguai",
  "Uzbequistão", "Vanuatu", "Vaticano", "Venezuela", "Vietnã", "Zâmbia",
  "Zimbábue",
];

// Transforma o arquivo de cidades ({ SC: "Abdon Batista|...|Xaxim" })
// numa lista só, em ordem alfabética. Cada cidade vira:
// { nome: "Balneário Camboriú", uf: "SC", texto: "Balneário Camboriú - SC",
//   busca: "balneario camboriu - sc" }  <- "busca" é o texto sem acento, para comparar
export function listaDeCidades(cidadesPorEstado) {
  const lista = [];
  for (const [uf, nomes] of Object.entries(cidadesPorEstado)) {
    for (const nome of nomes.split("|")) {
      const texto = `${nome} - ${uf}`;
      lista.push({ nome, uf, texto, busca: semAcento(texto) });
    }
  }
  return lista.sort(
    (a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.uf.localeCompare(b.uf)
  );
}

// Cidades que combinam com o que a pessoa digitou, sem ligar para acento e maiúscula.
// Primeiro as que COMEÇAM com o texto ("sao pa" -> "São Paulo - SP"),
// depois as que só têm o texto no meio ("camboriu" -> "Balneário Camboriú - SC").
// Campo vazio não mostra nada (seriam mais de 5 mil cidades).
export function filtrarCidades(lista, digitado) {
  const procurado = semAcento(digitado.trim());
  if (!procurado) return [];

  const comecam = lista.filter((cidade) => cidade.busca.startsWith(procurado));
  const temNoMeio = lista.filter(
    (cidade) =>
      !cidade.busca.startsWith(procurado) && cidade.busca.includes(procurado)
  );
  return [...comecam, ...temNoMeio];
}

// Baixa o arquivo de cidades só na primeira vez que alguém precisa dele.
// Nas outras vezes devolve a mesma lista (guardada em "cidadesCarregadas").
let cidadesCarregadas = null;

export function carregarCidades() {
  if (!cidadesCarregadas) {
    cidadesCarregadas = import("./cidadesBrasil.js").then(({ cidadesPorEstado }) =>
      listaDeCidades(cidadesPorEstado)
    );
    // Se falhar (ex.: sem internet), esquece, para tentar de novo da próxima vez
    cidadesCarregadas.catch(() => {
      cidadesCarregadas = null;
    });
  }
  return cidadesCarregadas;
}

export const AVISO_CEP_NAO_ENCONTRADO = "CEP não encontrado.";
export const AVISO_CEP_FALHOU =
  "Não foi possível buscar o CEP. Preencha o endereço à mão.";

// Procura o CEP no ViaCEP. Devolve:
// - { rua, cidade, estado } quando acha (ex.: 88330-000 -> Balneário Camboriú, SC)
// - { aviso: "CEP não encontrado." } quando o CEP não existe
// - { aviso: "Não foi possível buscar..." } quando a busca falha (ex.: sem internet)
export async function buscarCep(cep) {
  try {
    const numeros = cep.replace(/\D/g, "");
    const resposta = await fetch(`https://viacep.com.br/ws/${numeros}/json/`);
    const dados = await resposta.json();

    if (dados.erro) {
      return { aviso: AVISO_CEP_NAO_ENCONTRADO };
    }

    return { rua: dados.logradouro, cidade: dados.localidade, estado: dados.uf };
  } catch {
    return { aviso: AVISO_CEP_FALHOU };
  }
}
