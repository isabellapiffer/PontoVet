import { useState, useRef, useEffect } from "react";

const descricoesEspecialidades = {
  "Clínico Geral": [
    "O clínico geral cuida da saúde do animal como um todo: consultas de rotina, vacinação, vermifugação, check-ups e os primeiros sinais de qualquer doença. É quem conhece o histórico completo do seu pet, acompanha ao longo da vida e identifica cedo quando algo precisa de um especialista.",
    "É sempre o primeiro passo. Vale procurar um especialista quando o clínico indicar, quando o problema volta mesmo com tratamento ou quando o animal tem uma doença crônica que precisa de acompanhamento específico.",
    "No dia a dia, o clínico atende principalmente vômito e diarreia, otites e coceiras leves, pulgas, carrapatos e vermes, doença do carrapato, tártaro e sobrepeso.",
  ],

  "Cardiologista": [
    "O cardiologista cuida do coração e da circulação: sopros, arritmias, insuficiência cardíaca e pressão alta. Com exames como ecocardiograma e eletrocardiograma, ele descobre doenças cardíacas antes de aparecerem sintomas e ajusta a medicação para dar mais tempo e qualidade de vida ao animal.",
    "Procure quando o clínico ouvir um sopro, ou se o animal tiver tosse persistente, cansaço fácil, desmaios, respiração acelerada em repouso ou barriga inchada. Também é indicado antes de anestesias em animais idosos ou de raças predispostas.",
    "As alterações mais comuns são a doença da válvula mitral, típica de cães pequenos e idosos, a cardiomiopatia dilatada em cães grandes, a cardiomiopatia hipertrófica em gatos, as arritmias e a hipertensão.",
    "Algumas raças são mais predispostas. Cavalier King Charles, Poodle, Dachshund, Shih-tzu e Maltês têm mais doença da válvula mitral. Dobermann e Dogue Alemão têm mais cardiomiopatia dilatada, e o Boxer, um tipo de cardiomiopatia que causa arritmias. Entre os gatos, Maine Coon, Ragdoll, Sphynx e Persa têm mais cardiomiopatia hipertrófica.",
  ],

  "Dermatologista": [
    "O dermatologista cuida da pele, dos pelos, das unhas e dos ouvidos: alergias, coceiras, feridas, queda de pelo e infecções. Como problemas de pele costumam voltar, ele investiga a causa (alergia, parasita, fungo ou hormônio) em vez de tratar só o sintoma, o que reduz as recaídas e o uso repetido de medicamentos.",
    "Procure quando a coceira ou a otite voltam várias vezes, quando o tratamento não resolve, ou se houver feridas que não cicatrizam, falhas de pelo ou mau cheiro persistente.",
    "As alterações mais comuns são a dermatite atópica (alergia ambiental), a alergia alimentar e à picada de pulga, as otites de repetição, as infecções de pele por bactérias e fungos, as sarnas e a micose, que pode passar para pessoas.",
    "Algumas raças são mais predispostas. Bulldog Francês, Shih-tzu, Golden, Labrador, West Highland e Pug têm mais dermatite atópica. Cocker Spaniel e Basset Hound sofrem mais com otites crônicas. Shar-pei, Bulldog Inglês e Pug têm dermatite nas dobras de pele, e o gato Persa tem mais micose.",
  ],

  "Felinos": [
    "O especialista em felinos atende só gatos, que têm comportamento, doenças e necessidades bem diferentes dos cães. Gatos escondem dor e doença, e esse profissional sabe ler os sinais sutis e fazer um manejo com menos estresse. O atendimento em casa ajuda muito os gatos que sofrem com transporte.",
    "Procure se o gato parar de comer por mais de um dia, emagrecer, beber muita água, urinar fora da caixa ou com esforço, ou mudar de comportamento. Gato macho que tenta urinar e não consegue é emergência.",
    "As alterações mais comuns são a doença renal crônica, muito frequente em gatos idosos, a cistite e a obstrução urinária, o hipertireoidismo, a gengivite, as viroses FIV e FeLV e a lipidose hepática, que aparece quando o gato fica dias sem comer.",
    "Algumas raças são mais predispostas. Persa e Exótico têm mais rim policístico e problemas oculares e respiratórios. Maine Coon, Ragdoll e Sphynx têm mais cardiomiopatia hipertrófica, e o Siamês, asma felina. Machos castrados de qualquer raça têm mais risco de obstrução urinária.",
  ],

  "Gastroenterologista": [
    "O gastroenterologista cuida do sistema digestivo: estômago, intestino, fígado e pâncreas. Ele investiga a fundo os casos que não melhoram com o tratamento comum, com exames específicos e ajuste de dieta e medicação para controlar doenças digestivas crônicas.",
    "Procure quando o vômito ou a diarreia duram mais de duas a três semanas ou voltam com frequência, ou se houver perda de peso sem explicação, falta de apetite prolongada ou sangue nas fezes.",
    "As alterações mais comuns são as gastroenterites, a pancreatite, a doença inflamatória intestinal, a intolerância e a alergia alimentar, as doenças do fígado e as parasitoses de repetição, como a giardíase.",
    "Algumas raças são mais predispostas. Schnauzer Miniatura e Yorkshire têm mais pancreatite. O Pastor Alemão tem mais insuficiência pancreática e doença intestinal crônica. Boxer e Bulldog Francês têm mais colites. Yorkshire e Maltês têm mais shunt hepático, e Labrador e Dobermann, hepatite crônica.",
  ],

  "Imagem": [
    "O veterinário de imagem faz exames como ultrassom, raio-x, ecocardiograma e tomografia, que mostram o que está acontecendo por dentro do animal. Isso permite diagnósticos mais rápidos e precisos, muitas vezes sem procedimentos invasivos. Ultrassom e raio-x portátil podem ser feitos em casa, com menos estresse.",
    "Normalmente quem pede o exame é o veterinário que está acompanhando o caso. É comum em check-ups de animais idosos, no acompanhamento de gestação e em suspeitas de fratura, tumor ou ingestão de objetos.",
    "Os exames costumam encontrar cálculos na bexiga e nos rins, tumores e massas abdominais, gestação e infecção de útero, fraturas e problemas articulares, objetos engolidos e alterações em fígado, baço e rins.",
    "Algumas raças se beneficiam de exames preventivos. Raças grandes como Pastor Alemão, Labrador e Golden costumam fazer raio-x de quadril para avaliar displasia. O gato Persa faz ultrassom para investigar rim policístico. Cavalier, Dobermann, Boxer e Maine Coon fazem ecocardiograma de rotina.",
  ],

  "Nefrologista": [
    "O nefrologista cuida dos rins e do trato urinário: insuficiência renal, cálculos e infecções urinárias. A doença renal não tem cura, mas com diagnóstico precoce e acompanhamento certo de dieta, hidratação e pressão o animal pode viver bem por anos.",
    "Procure se o animal bebe muita água e urina muito, tem sangue na urina, infecções urinárias repetidas, cálculos que voltam ou exames de sangue com ureia e creatinina alteradas.",
    "As alterações mais comuns são a doença renal crônica, a lesão renal aguda por intoxicações ou leptospirose, os cálculos urinários, a infecção urinária de repetição, a perda de proteína pela urina e a incontinência urinária.",
    "Algumas raças são mais predispostas. O gato Persa tem mais rim policístico. Dálmata e Bulldog Inglês formam mais cálculos de urato. Schnauzer Miniatura, Shih-tzu, Lhasa Apso e Yorkshire têm mais cálculos urinários em geral, e o Shar-pei, amiloidose renal. Gatos idosos de qualquer raça têm alto risco de doença renal crônica.",
  ],

  "Neurologista": [
    "O neurologista cuida do cérebro, da medula e dos nervos: convulsões, perda de equilíbrio, paralisias e dores na coluna. Ele localiza onde está o problema no sistema nervoso, indica os exames certos, como tomografia e ressonância, e define se o caso é de remédio, fisioterapia ou cirurgia.",
    "Procure em caso de convulsões, andar cambaleante, cabeça torta, fraqueza ou arrastar das patas, dor forte ao ser tocado no pescoço ou nas costas, ou mudanças bruscas de comportamento. Perda repentina dos movimentos é urgência.",
    "As alterações mais comuns são a epilepsia, a hérnia de disco, a síndrome vestibular (conhecida como labirintite), as inflamações do cérebro e da medula, a disfunção cognitiva do idoso e os traumas de coluna.",
    "Algumas raças são mais predispostas. Dachshund, Bulldog Francês, Beagle, Shih-tzu e Pequinês têm mais hérnia de disco. Border Collie, Pastor Australiano, Beagle, Labrador e Golden têm mais epilepsia. O Cavalier King Charles tem mais siringomielia. Pastor Alemão e Boxer têm mais mielopatia degenerativa. Dobermann e Dogue Alemão têm a síndrome de Wobbler, e Yorkshire, Chihuahua e Spitz, instabilidade no pescoço.",
  ],

  "Nutrólogo/Nutricionista": [
    "O nutrólogo monta planos alimentares sob medida: emagrecimento, alimentação natural balanceada e dietas para animais com doenças. A alimentação certa previne e ajuda a tratar várias doenças, e a dieta calculada para o seu animal evita os erros comuns das receitas caseiras feitas sem orientação.",
    "Procure se o animal está acima ou abaixo do peso, se você quer oferecer comida caseira, se ele tem doença renal, alergia alimentar, diabetes ou problemas digestivos, ou em fases especiais, como filhotes de raças gigantes e idosos.",
    "As alterações mais comuns são a obesidade, a magreza com perda de massa muscular, a alergia e a intolerância alimentar, as deficiências causadas por dieta caseira desbalanceada e o colesterol e os triglicerídeos altos.",
    "Algumas raças são mais predispostas. Labrador, Beagle, Pug, Golden, Cocker e Dachshund engordam com mais facilidade, assim como gatos castrados que vivem dentro de casa. O Schnauzer Miniatura tende a ter triglicerídeos altos. Filhotes de raças gigantes podem ter problemas de crescimento por excesso de cálcio e calorias.",
  ],

  "Oftalmologista": [
    "O oftalmologista cuida dos olhos e das pálpebras: catarata, úlceras, glaucoma, olho seco e outras doenças que afetam a visão. Ele tem equipamentos próprios para examinar o olho por dentro e medir a pressão ocular. Problemas nos olhos pioram rápido, e tratar cedo pode salvar a visão.",
    "Procure se o olho estiver vermelho, fechado ou com muita secreção, azulado ou esbranquiçado, ou se o animal estiver esbarrando nos móveis ou coçando o olho. Olho fechado com dor é urgência.",
    "As alterações mais comuns são a úlcera de córnea, o olho seco, a catarata, o glaucoma, o entrópio (pálpebra virada para dentro) e o olho de cereja, que é o prolapso da glândula da terceira pálpebra.",
    "Algumas raças são mais predispostas. Shih-tzu, Pug, Bulldog Francês, Pequinês e Lhasa Apso têm mais úlcera de córnea e olho seco. Poodle, Cocker Spaniel, Schnauzer e Yorkshire têm mais catarata. Cocker Spaniel, Basset Hound e Beagle têm mais glaucoma. Shar-pei, Chow Chow e Bulldog Inglês têm mais entrópio. Bulldog, Beagle e Cocker têm mais olho de cereja, e o gato Persa, sequestro de córnea.",
  ],

  "Oncologista": [
    "O oncologista diagnostica e trata tumores e câncer, e acompanha o animal durante e depois do tratamento. Ele define o tipo e o estágio do tumor e monta o plano mais adequado, que pode incluir cirurgia, quimioterapia ou cuidados paliativos, sempre com foco em conforto e qualidade de vida.",
    "Procure diante de qualquer caroço novo, que cresce ou muda de aspecto, feridas que não cicatrizam, ínguas aumentadas ou emagrecimento sem explicação. Quanto mais cedo, melhores as opções de tratamento.",
    "As alterações mais comuns são os tumores de mama, principalmente em fêmeas não castradas, o mastocitoma (um tumor de pele), o linfoma, o osteossarcoma (tumor ósseo), o hemangiossarcoma, que atinge baço e coração, o carcinoma de pele e o TVT, o tumor venéreo transmissível.",
    "Algumas raças são mais predispostas. Boxer, Bulldog, Pug, Labrador, Golden e Shar-pei têm mais mastocitoma. Golden Retriever, Boxer e Rottweiler têm mais linfoma. Rottweiler, Dogue Alemão, São Bernardo e outras raças gigantes têm mais osteossarcoma. Pastor Alemão, Golden e Labrador têm mais hemangiossarcoma. Gatos brancos e cães de pele clara expostos ao sol têm mais carcinoma de pele.",
  ],

  "Ortopedista": [
    "O ortopedista cuida de ossos, articulações, ligamentos e músculos: fraturas, displasias, luxações e dificuldade para andar. Ele identifica a origem exata da dor ou da manqueira e indica o melhor caminho, seja cirurgia, fisioterapia ou controle da dor, para o animal voltar a se movimentar com conforto.",
    "Procure se o animal manca por mais de alguns dias, tem dificuldade para levantar, subir escadas ou pular, corre com as patas traseiras juntas (o chamado pulo de coelho) ou sofreu queda ou atropelamento.",
    "As alterações mais comuns são a displasia coxofemoral (do quadril), a displasia de cotovelo, a ruptura do ligamento cruzado do joelho, a luxação de patela, a artrose e as fraturas.",
    "Algumas raças são mais predispostas. Pastor Alemão, Labrador, Golden, Rottweiler e São Bernardo têm mais displasia coxofemoral. Labrador, Rottweiler e Bernese têm mais displasia de cotovelo. Labrador, Rottweiler, Pit Bull e Boxer rompem mais o ligamento cruzado. Poodle, Yorkshire, Spitz, Chihuahua e Pinscher têm mais luxação de patela, e Yorkshire, Poodle Toy e Pinscher, necrose da cabeça do fêmur. Entre os gatos, o Scottish Fold tem uma doença articular hereditária.",
  ],

  "Silvestres": [
    "O veterinário de silvestres atende animais silvestres e exóticos, como aves, répteis, coelhos, roedores e furões, que têm manejo bem diferente de cães e gatos. A maior parte das doenças desses animais vem de erros de alimentação e de ambiente, e o especialista orienta dieta, iluminação, temperatura e recinto, além de saber examinar espécies que escondem os sinais de doença.",
    "Procure logo depois de adquirir o animal, para uma orientação inicial, e sempre que ele parar de comer, ficar quieto ou arrepiado, ou tiver alteração nas fezes, nas penas, no casco ou nos dentes. Nessas espécies, esperar costuma agravar o quadro.",
    "As alterações mais comuns são os problemas por dieta inadequada, o crescimento exagerado dos dentes, a doença óssea por falta de cálcio e de luz UVB, os problemas respiratórios, o arrancamento de penas e a retenção de ovos.",
    "Algumas espécies são mais predispostas. Coelhos, porquinhos-da-índia e chinchilas têm dentes que crescem demais e parada do intestino. O porquinho-da-índia tem falta de vitamina C. Calopsitas e periquitos têm retenção de ovo. Papagaios desenvolvem obesidade e gordura no fígado com dieta só de sementes. Jabutis, tigres-d'água e iguanas têm doença óssea e deformação do casco, e os furões, doenças hormonais.",
  ],

  "Grandes Animais": [
    "O veterinário de grandes animais atende cavalos, bois, cabras e ovelhas, geralmente direto na propriedade, sem precisar transportar o animal. Ele cuida tanto do indivíduo quanto do rebanho: vacinação, controle de parasitas, reprodução e manejo.",
    "Procure para o acompanhamento de rotina do plantel e sempre que o animal parar de comer, mancar, tiver ferida, parto difícil ou queda na produção. Cavalo com sinais de cólica, que rola, cava o chão e olha para o flanco, é emergência.",
    "As alterações mais comuns são a cólica, a laminite, as manqueiras e os problemas dentários em cavalos, a mastite, as doenças de casco e a tristeza parasitária em bovinos, e a verminose em cabras e ovelhas.",
    "Algumas raças são mais predispostas. O Quarto de Milha tem mais doenças musculares hereditárias e síndrome do navicular. O Puro Sangue Inglês tem mais úlcera gástrica e sangramento pulmonar no esforço. Pôneis têm mais laminite ligada à obesidade. Vacas leiteiras de alta produção, como Holandesa e Jersey, têm mais mastite e febre do leite, e as raças europeias de bovinos, como Holandesa e Angus, são mais sensíveis a carrapato e à tristeza parasitária.",
  ],
};

export function ModalDuvidas({ aberto, onFechar }) {
  const [selecionada, setSelecionada] = useState("");
  const caixaRef = useRef(null);

  useEffect(() => {
    function aoClicarFora(evento) {
      if (caixaRef.current && !caixaRef.current.contains(evento.target)) {
        onFechar();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, [onFechar]);

  if (!aberto) {
    return null;
  }

  return (
    <div className="modal-fundo">
      <div className="modal-duvidas" ref={caixaRef}>
        <button className="modal-fechar" onClick={onFechar}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-menu">
          {Object.keys(descricoesEspecialidades).map((especialidade) => (
            <p
              key={especialidade}
              className={especialidade === selecionada ? "ativo" : ""}
              onClick={() => setSelecionada(especialidade)}
            >
              {especialidade}
            </p>
          ))}
        </div>

        <div
          className={
            selecionada ? "modal-texto" : "modal-texto modal-texto-centralizado"
          }
        >
          {selecionada ? (
            <>
              <h3>{selecionada}</h3>
              {descricoesEspecialidades[selecionada].map((paragrafo) => (
                <p key={paragrafo}>{paragrafo}</p>
              ))}
              <p className="modal-rodape">
                Conteúdo informativo. Não substitui a avaliação de um
                médico-veterinário.
              </p>
            </>
          ) : (
            <p className="modal-pergunta-inicial">
              Está em dúvida sobre o que cada especialidade faz?
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
