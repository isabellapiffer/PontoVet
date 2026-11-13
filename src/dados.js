// Profissionais FICTÍCIOS, só para demonstração, até a lista vir do Supabase.
// Nomes, endereços, notas e avaliações são inventados.
// As fotos são do Pexels (licença livre); os créditos estão em public/fotos-fake/CREDITOS.md.
// - especialidade: escrita igual à lista do filtro do Buscar
// - endereco: só aparece para quem está logado
// - avaliacoes: o "autor" só aparece para quem está logado
// - nota: média das avaliações, arredondada para uma casa (null = "Novo")
export const vets = [
  {
    id: 1,
    nome: "Ana Ribeiro",
    especialidade: "Felinos",
    cidade: "Florianópolis",
    endereco: "Rua Exemplo, 101 - Trindade, Florianópolis",
    foto: "/fotos-fake/pexels-19963165.jpg",
    nota: 5,
    especies: ["gato"],
    sobre:
      "Atendo só gatos há 8 anos. O consultório tem sala separada e feromônio no ambiente, para eles ficarem mais tranquilos.",
    avaliacoes: [
      { id: 1, autor: "Mariana S.", nota: 5, comentario: "Minha gata, que odeia veterinário, ficou calma a consulta inteira.", data: "28/10/2026", atendimento: "Consulta", pet: "Luna" },
      { id: 2, autor: "Rodrigo P.", nota: 5, comentario: "Explicou tudo sobre a doença renal do Tom com muita paciência.", data: "12/10/2026", atendimento: "Exames", pet: "Tom" },
    ],
  },
  {
    id: 2,
    nome: "Bruno Teixeira",
    especialidade: "Clínico Geral",
    cidade: "Joinville",
    endereco: "Rua Exemplo, 202 - América, Joinville",
    foto: "/fotos-fake/pexels-6235664.jpg",
    nota: 4.8,
    especies: ["cão", "gato"],
    sobre:
      "Clínico geral de cães e gatos. Faço consultas, vacinas e check-ups, também em casa para quem tem dificuldade de levar o pet.",
    avaliacoes: [
      { id: 1, autor: "Fernanda L.", nota: 5, comentario: "Veio em casa vacinar os dois cachorros, super atencioso.", data: "05/11/2026", atendimento: "Vacina", pet: "Bolinha" },
      { id: 2, autor: "Carlos M.", nota: 4.5, comentario: "Bom atendimento, só atrasou um pouco.", data: "18/10/2026", atendimento: "Consulta", pet: "Thor" },
    ],
  },
  {
    id: 3,
    nome: "Camila Duarte",
    especialidade: "Dermatologista",
    cidade: "Blumenau",
    endereco: "Rua Exemplo, 303 - Victor Konder, Blumenau",
    foto: "/fotos-fake/pexels-6749773.jpg",
    nota: 4.5,
    especies: ["cão", "gato"],
    sobre:
      "Dermatologista de cães e gatos. Investigo a causa das alergias, coceiras e otites que voltam, para o tratamento durar.",
    avaliacoes: [
      { id: 1, autor: "Juliana R.", nota: 4.5, comentario: "A coceira do Max finalmente melhorou depois da troca de ração.", data: "22/10/2026", atendimento: "Consulta", pet: "Max" },
    ],
  },
  {
    id: 4,
    nome: "Diego Ramos",
    especialidade: "Ortopedista",
    cidade: "Chapecó",
    endereco: "Rua Exemplo, 404 - Centro, Chapecó",
    foto: "/fotos-fake/pexels-6129500.jpg",
    nota: 4.8,
    especies: ["cão"],
    sobre:
      "Ortopedista de cães. Cuido de displasia, ligamento rompido, hérnia de disco e fraturas, com cirurgia e fisioterapia.",
    avaliacoes: [
      { id: 1, autor: "Paulo H.", nota: 5, comentario: "Operou o joelho da Mel e hoje ela corre como antes.", data: "30/09/2026", atendimento: "Consulta", pet: "Mel" },
      { id: 2, autor: "Aline T.", nota: 4.5, comentario: "Muito claro na explicação do raio-x.", data: "14/10/2026", atendimento: "Exames", pet: "Rex" },
    ],
  },
  {
    id: 5,
    nome: "Eduarda Lopes",
    especialidade: "Clínico Geral",
    cidade: "Balneário Camboriú",
    endereco: "Rua Exemplo, 505 - Centro, Balneário Camboriú",
    foto: "/fotos-fake/pexels-20527270.jpg",
    nota: 5,
    especies: ["cão", "gato"],
    sobre:
      "Formada há 3 anos, atendo cães e gatos em consultório e a domicílio. Gosto de explicar tudo com calma para o tutor.",
    avaliacoes: [
      { id: 1, autor: "Beatriz C.", nota: 5, comentario: "Muito carinhosa com a Pipoca, que é bem medrosa.", data: "08/11/2026", atendimento: "Consulta", pet: "Pipoca" },
    ],
  },
  {
    id: 6,
    nome: "Fábio Nunes",
    especialidade: "Grandes Animais",
    cidade: "Lages",
    endereco: "Rua Exemplo, 606 - Coral, Lages",
    foto: "/fotos-fake/pexels-8460090.jpg",
    nota: 4.8,
    especies: ["cavalo", "bovino/pequeno ruminante"],
    sobre:
      "Há 20 anos atendo cavalos, bois, ovelhas e cabras na serra catarinense, sempre na propriedade.",
    avaliacoes: [
      { id: 1, autor: "Sérgio A.", nota: 4.5, comentario: "Veio até o sítio no mesmo dia para ver a égua.", data: "19/10/2026", atendimento: "Consulta", pet: "Estrela" },
      { id: 2, autor: "Márcia F.", nota: 5, comentario: "Vacinou o rebanho todo e deixou tudo anotado.", data: "02/10/2026", atendimento: "Vacina", pet: "Rebanho" },
    ],
  },
  {
    id: 7,
    nome: "Gabriela Moreira",
    especialidade: "Cardiologista",
    cidade: "Florianópolis",
    endereco: "Rua Exemplo, 707 - Centro, Florianópolis",
    foto: "/fotos-fake/pexels-15752232.jpg",
    nota: 4.5,
    especies: ["cão", "gato"],
    sobre:
      "Cardiologista de cães e gatos. Faço ecocardiograma e eletrocardiograma e acompanho pets com sopro e insuficiência cardíaca.",
    avaliacoes: [
      { id: 1, autor: "Ricardo N.", nota: 5, comentario: "Descobriu o sopro do Fred cedo e ajustou o remédio.", data: "25/10/2026", atendimento: "Exames", pet: "Fred" },
      { id: 2, autor: "Laura B.", nota: 4, comentario: "Ótima profissional, mas a agenda é bem disputada.", data: "09/10/2026", atendimento: "Consulta", pet: "Nina" },
    ],
  },
  {
    id: 8,
    nome: "Henrique Prado",
    especialidade: "Silvestres",
    cidade: "Itajaí",
    endereco: "Rua Exemplo, 808 - Fazenda, Itajaí",
    foto: "/fotos-fake/pexels-14438788.jpg",
    nota: null,
    especies: ["aves"],
    sobre:
      "Atendo aves, répteis e outros animais silvestres e exóticos de estimação, legalizados.",
    avaliacoes: [],
  },
  {
    id: 9,
    nome: "Isadora Campos",
    especialidade: "Oftalmologista",
    cidade: "Joinville",
    endereco: "Rua Exemplo, 909 - Atiradores, Joinville",
    foto: "/fotos-fake/pexels-5214958.jpg",
    nota: 4.5,
    especies: ["cão", "gato"],
    sobre:
      "Oftalmologista de cães e gatos. Cuido de catarata, úlcera de córnea, olho seco e glaucoma.",
    avaliacoes: [
      { id: 1, autor: "Gustavo E.", nota: 4.5, comentario: "Tratou a úlcera no olho do Paçoca rapidinho.", data: "16/10/2026", atendimento: "Consulta", pet: "Paçoca" },
    ],
  },
  {
    id: 10,
    nome: "João Vitor Lima",
    especialidade: "Clínico Geral",
    cidade: "Criciúma",
    endereco: "Rua Exemplo, 1010 - Centro, Criciúma",
    foto: "/fotos-fake/pexels-7966248.jpg",
    nota: 4.3,
    especies: ["cão", "gato"],
    sobre:
      "Clínico geral de cães e gatos, com plantão aos fins de semana na clínica.",
    avaliacoes: [
      { id: 1, autor: "Tatiane V.", nota: 4, comentario: "Atendeu num domingo, quando eu mais precisei.", data: "03/11/2026", atendimento: "Consulta", pet: "Bob" },
      { id: 2, autor: "André K.", nota: 4.5, comentario: "Vacina tranquila e rápida.", data: "20/10/2026", atendimento: "Vacina", pet: "Lili" },
    ],
  },
  {
    id: 11,
    nome: "Larissa Souza",
    especialidade: "Nutrólogo/Nutricionista",
    cidade: "São José",
    endereco: "Rua Exemplo, 1111 - Kobrasol, São José",
    foto: "/fotos-fake/pexels-4173251.jpg",
    nota: 5,
    especies: ["cão", "gato"],
    sobre:
      "Monto dietas para pets com sobrepeso, diabetes, doença renal e alergia alimentar, inclusive alimentação natural.",
    avaliacoes: [
      { id: 1, autor: "Patrícia O.", nota: 5, comentario: "O Biscoito perdeu 3 kg com a dieta que ela montou.", data: "27/10/2026", atendimento: "Consulta", pet: "Biscoito" },
    ],
  },
  {
    id: 12,
    nome: "Mateus Andrade",
    especialidade: "Neurologista",
    cidade: "Blumenau",
    endereco: "Rua Exemplo, 1212 - Garcia, Blumenau",
    foto: "/fotos-fake/pexels-5888160.jpg",
    nota: null,
    especies: ["cão", "gato"],
    sobre:
      "Neurologista de cães e gatos. Atendo convulsões, hérnia de disco e problemas de equilíbrio.",
    avaliacoes: [],
  },
  {
    id: 13,
    nome: "Natália Ferreira",
    especialidade: "Oncologista",
    cidade: "Joinville",
    endereco: "Rua Exemplo, 1313 - Saguaçu, Joinville",
    foto: "/fotos-fake/pexels-33674900.jpg",
    nota: 5,
    especies: ["cão", "gato"],
    sobre:
      "Oncologista de cães e gatos. Faço quimioterapia e cuidados para dar qualidade de vida durante o tratamento.",
    avaliacoes: [
      { id: 1, autor: "Eliane D.", nota: 5, comentario: "Humana e sincera num momento muito difícil.", data: "11/10/2026", atendimento: "Consulta", pet: "Amora" },
      { id: 2, autor: "Fábio G.", nota: 5, comentario: "O Zeca está respondendo muito bem à quimio.", data: "01/11/2026", atendimento: "Medicações/Cuidados", pet: "Zeca" },
    ],
  },
  {
    id: 14,
    nome: "Otávio Reis",
    especialidade: "Grandes Animais",
    cidade: "Chapecó",
    endereco: "Rua Exemplo, 1414 - Efapi, Chapecó",
    foto: "/fotos-fake/pexels-4989142.jpg",
    nota: 4.5,
    especies: ["bovino/pequeno ruminante", "cavalo"],
    sobre:
      "Atendo gado de leite e de corte no oeste catarinense: reprodução, vacinas e partos.",
    avaliacoes: [
      { id: 1, autor: "Ivo S.", nota: 4.5, comentario: "Ajudou num parto complicado de madrugada.", data: "07/10/2026", atendimento: "Consulta", pet: "Mimosa" },
    ],
  },
  {
    id: 15,
    nome: "Patrícia Gomes",
    especialidade: "Imagem",
    cidade: "Itajaí",
    endereco: "Rua Exemplo, 1515 - Centro, Itajaí",
    foto: "/fotos-fake/pexels-3714743.jpg",
    nota: 4.8,
    especies: ["cão", "gato"],
    sobre:
      "Faço ultrassom e raio-x de cães e gatos, também com aparelho portátil em casa.",
    avaliacoes: [
      { id: 1, autor: "Leonardo C.", nota: 4.5, comentario: "Ultrassom em casa, a Mia nem se estressou.", data: "24/10/2026", atendimento: "Exames", pet: "Mia" },
      { id: 2, autor: "Sabrina M.", nota: 5, comentario: "Laudo saiu no mesmo dia.", data: "13/10/2026", atendimento: "Exames", pet: "Duque" },
    ],
  },
  {
    id: 16,
    nome: "Rafael Martins",
    especialidade: "Clínico Geral",
    cidade: "Palhoça",
    endereco: "Rua Exemplo, 1616 - Pedra Branca, Palhoça",
    foto: "/fotos-fake/pexels-4270371.jpg",
    nota: 4,
    especies: ["cão", "gato"],
    sobre:
      "Clínico geral de cães e gatos. Atendo consultas, vacinas e emissão de atestado de saúde para viagem.",
    avaliacoes: [
      { id: 1, autor: "Vanessa J.", nota: 4, comentario: "Fez o atestado para a viagem sem complicação.", data: "29/10/2026", atendimento: "Atestado de saúde", pet: "Lola" },
    ],
  },
  {
    id: 17,
    nome: "Sofia Almeida",
    especialidade: "Felinos",
    cidade: "Balneário Camboriú",
    endereco: "Rua Exemplo, 1717 - Pioneiros, Balneário Camboriú",
    foto: "/fotos-fake/pexels-8376309.jpg",
    nota: 4.8,
    especies: ["gato"],
    sobre:
      "Atendo só gatos, em casa, para evitar o estresse do transporte.",
    avaliacoes: [
      { id: 1, autor: "Cristina F.", nota: 5, comentario: "Ótima com o Simba, que é bravo.", data: "06/11/2026", atendimento: "Consulta", pet: "Simba" },
      { id: 2, autor: "Diego B.", nota: 4.5, comentario: "Pontual e muito cuidadosa.", data: "15/10/2026", atendimento: "Vacina", pet: "Mel" },
    ],
  },
  {
    id: 18,
    nome: "Thiago Costa",
    especialidade: "Gastroenterologista",
    cidade: "Jaraguá do Sul",
    endereco: "Rua Exemplo, 1818 - Centro, Jaraguá do Sul",
    foto: "/fotos-fake/pexels-13422327.jpg",
    nota: 4.5,
    especies: ["cão", "gato"],
    sobre:
      "Gastroenterologista de cães e gatos. Investigo vômito e diarreia que não passam, pancreatite e doenças do fígado.",
    avaliacoes: [
      { id: 1, autor: "Renata P.", nota: 4.5, comentario: "Descobriu que era pancreatite e o Toby melhorou.", data: "21/10/2026", atendimento: "Consulta", pet: "Toby" },
    ],
  },
  {
    id: 19,
    nome: "Vera Lúcia Pires",
    especialidade: "Nefrologista",
    cidade: "Florianópolis",
    endereco: "Rua Exemplo, 1919 - Estreito, Florianópolis",
    foto: "/fotos-fake/pexels-8376284.jpg",
    nota: 5,
    especies: ["cão", "gato"],
    sobre:
      "Nefrologista com 25 anos de experiência. Acompanho cães e gatos com doença renal crônica e cálculos.",
    avaliacoes: [
      { id: 1, autor: "Marcelo T.", nota: 5, comentario: "A Mimi está estável há um ano com o acompanhamento dela.", data: "04/11/2026", atendimento: "Consulta", pet: "Mimi" },
    ],
  },
  {
    id: 20,
    nome: "Wesley Santos",
    especialidade: "Silvestres",
    cidade: "Tubarão",
    endereco: "Rua Exemplo, 2020 - Centro, Tubarão",
    foto: "/fotos-fake/pexels-10826541.jpg",
    nota: 4.5,
    especies: ["aves"],
    sobre:
      "Atendo aves e animais silvestres e exóticos, como calopsitas, papagaios e jabutis.",
    avaliacoes: [
      { id: 1, autor: "Helena R.", nota: 4.5, comentario: "Cuidou da asa da minha calopsita com muito jeito.", data: "17/10/2026", atendimento: "Consulta", pet: "Kiwi" },
    ],
  },
  {
    id: 21,
    nome: "Yasmin Oliveira",
    especialidade: "Dermatologista",
    cidade: "Criciúma",
    endereco: "Rua Exemplo, 2121 - Pio Corrêa, Criciúma",
    foto: "/fotos-fake/pexels-19596247.jpg",
    nota: null,
    especies: ["cão", "gato"],
    sobre:
      "Dermatologista de cães e gatos, recém-chegada a Criciúma. Atendo alergias, micose e queda de pelo.",
    avaliacoes: [],
  },
  {
    id: 22,
    nome: "Lucas Pereira",
    especialidade: "Ortopedista",
    cidade: "Brusque",
    endereco: "Rua Exemplo, 2222 - Centro, Brusque",
    foto: "/fotos-fake/pexels-19438560.jpg",
    nota: 4.5,
    especies: ["cão"],
    sobre:
      "Ortopedista de cães, com foco em raças grandes e cães idosos com artrose.",
    avaliacoes: [
      { id: 1, autor: "Simone K.", nota: 4, comentario: "O tratamento da artrose do Bruce ajudou bastante.", data: "10/10/2026", atendimento: "Consulta", pet: "Bruce" },
      { id: 2, autor: "Jorge L.", nota: 5, comentario: "Muito atencioso no pós-operatório.", data: "26/10/2026", atendimento: "Medicações/Cuidados", pet: "Apolo" },
    ],
  },
  {
    id: 23,
    nome: "Beatriz Rocha",
    especialidade: "Clínico Geral",
    cidade: "Itapema",
    endereco: "Rua Exemplo, 2323 - Meia Praia, Itapema",
    foto: "/fotos-fake/pexels-19547592.jpg",
    nota: 5,
    especies: ["cão", "gato"],
    sobre:
      "Clínica geral de cães e gatos, atendo em casa em Itapema, Porto Belo e Bombinhas.",
    avaliacoes: [
      { id: 1, autor: "Rafaela N.", nota: 5, comentario: "Super querida, veio em casa ver a Kiara.", data: "02/11/2026", atendimento: "Consulta", pet: "Kiara" },
    ],
  },
  {
    id: 24,
    nome: "Helena Vieira",
    especialidade: "Grandes Animais",
    cidade: "Lages",
    endereco: "Rua Exemplo, 2424 - Universitário, Lages",
    foto: "/fotos-fake/pexels-8459997.jpg",
    nota: 4.5,
    especies: ["cavalo"],
    sobre:
      "Veterinária de equinos: atendo cavalos de esporte e de lida, com exames e cuidados com os cascos.",
    avaliacoes: [
      { id: 1, autor: "Otávio M.", nota: 4.5, comentario: "Resolveu a manqueira do Trovão.", data: "23/10/2026", atendimento: "Consulta", pet: "Trovão" },
      { id: 2, autor: "Luana P.", nota: 4.5, comentario: "Explicou direitinho o exame do casco.", data: "08/10/2026", atendimento: "Exames", pet: "Pérola" },
    ],
  },
  {
    id: 25,
    nome: "Carolina Mendes",
    especialidade: "Clínico Geral",
    cidade: "Rio do Sul",
    endereco: "Rua Exemplo, 2525 - Centro, Rio do Sul",
    foto: "/fotos-fake/pexels-18844981.jpg",
    nota: 4.8,
    especies: ["cão", "gato"],
    sobre:
      "Clínica geral de cães e gatos no Alto Vale do Itajaí. Faço consultas, vacinas e castração.",
    avaliacoes: [
      { id: 1, autor: "Daniela S.", nota: 5, comentario: "Castrou a Frida e acompanhou tudo de perto.", data: "31/10/2026", atendimento: "Consulta", pet: "Frida" },
      { id: 2, autor: "Rogério A.", nota: 4.5, comentario: "Atendimento rápido e preço justo.", data: "14/10/2026", atendimento: "Vacina", pet: "Pingo" },
    ],
  },
];
