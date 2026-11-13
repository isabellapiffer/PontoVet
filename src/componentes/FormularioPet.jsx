import { useEffect, useRef, useState } from "react";
import { IoCameraOutline } from "react-icons/io5";
import AjustarFoto from "./AjustarFoto.jsx";
import Gaveta from "./Gaveta.jsx";
import { UNIDADES_PESO, ultimoPeso, pesoDigitado, pesosParaSalvar } from "../peso.js";
import { TEMPOS_COM_LEMBRETE, hojeISO } from "../lembretes.js";
import HistoricoClinico, {
  historicoInicial,
  itensPreenchidos,
  doencasPreenchidas,
  erroNasDatasDoencas,
  medicacoesDasDoencas,
} from "./HistoricoClinico.jsx";
import { erroNasMedicacoes, medicacaoParaSalvar } from "./Medicacoes.jsx";
import { supabase } from "../supabaseClient.js";
import { abrirFotoEscolhida, AVISO_FOTO } from "../fotos.js";
import { PASTA_DOCUMENTOS, caminhoCarteirinha, tipoDoArquivo } from "../carteirinha.js";
import ListaOpcoes from "./ListaOpcoes.jsx";
import { SelectCostumizado } from "../paginas/Mural.jsx/SelectCostumizado.jsx";
import { especies, racasPorEspecie } from "../dadosPets.js";
import {
  formatarData,
  paraDataISO,
  validarData,
  deDataISO,
  dataEstimada,
  idadeEmAnosEMeses,
} from "../formatadores.js";
import "../paginas/Mural.jsx/mural.css";
import "../paginas/login.css";
import "../paginas/animais.css";

function CampoAutocomplete({ valor, aoDigitar, opcoes, placeholder }) {
  const [aberto, setAberto] = useState(false);
  const [indiceDestaque, setIndiceDestaque] = useState(-1);
  const caixaRef = useRef(null);
  const opcoesRefs = useRef([]);

  const opcoesFiltradas = opcoes.filter((opcao) =>
    opcao.toLowerCase().includes(valor.toLowerCase())
  );

  function escolher(opcao) {
    aoDigitar(opcao);
    setAberto(false);
    setIndiceDestaque(-1);
  }

  useEffect(() => {
    function aoClicarFora(evento) {
      if (caixaRef.current && !caixaRef.current.contains(evento.target)) {
        setAberto(false);
        setIndiceDestaque(-1);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, []);

  useEffect(() => {
    if (indiceDestaque >= 0 && opcoesRefs.current[indiceDestaque]) {
      opcoesRefs.current[indiceDestaque].scrollIntoView({ block: "nearest" });
    }
  }, [indiceDestaque]);

  return (
    <div className="select-custom" ref={caixaRef}>
      <input
        type="text"
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => {
          aoDigitar(evento.target.value);
          setAberto(true);
          setIndiceDestaque(-1);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowDown") {
            evento.preventDefault();
            setAberto(true);
            setIndiceDestaque((indiceAtual) =>
              Math.min(indiceAtual + 1, opcoesFiltradas.length - 1)
            );
          }
          if (evento.key === "ArrowUp") {
            evento.preventDefault();
            setIndiceDestaque((indiceAtual) => Math.max(indiceAtual - 1, 0));
          }
          if (evento.key === "Enter") {
            evento.preventDefault();
            if (indiceDestaque >= 0 && opcoesFiltradas[indiceDestaque]) {
              escolher(opcoesFiltradas[indiceDestaque]);
            } else if (opcoesFiltradas.length === 1) {
              // Igual ao campo Espécie: se só sobrou uma raça, o Enter escolhe ela
              escolher(opcoesFiltradas[0]);
            } else {
              // Várias ou nenhuma: fecha a lista e mantém o que foi digitado
              setAberto(false);
            }
          }
          if (evento.key === "Escape") {
            setAberto(false);
            setIndiceDestaque(-1);
          }
        }}
      />

      {aberto && opcoesFiltradas.length > 0 && (
        <div className="select-opcoes">
          {opcoesFiltradas.map((opcao, indice) => (
            <p
              key={opcao}
              ref={(el) => (opcoesRefs.current[indice] = el)}
              className={indice === indiceDestaque ? "select-destaque" : ""}
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolher(opcao);
              }}
            >
              {opcao}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Teste de FIV/FeLV para o banco. "Não" apaga os registros
function testeParaSalvar(teste) {
  return {
    testado: teste.testado,
    registros: teste.testado ? teste.registros : [],
  };
}

// Como o castrado vem do banco: true = Sim, false = Não, vazio = Não definido
export function textoCastrado(valor) {
  if (valor === true) return "Sim";
  if (valor === false) return "Não";
  return "Não definido";
}

// Aviso de cada campo digitado dos Dados do animal ("" = sem erro).
// Data completa errada e meses acima de 11 avisam na hora;
// vazio, data pela metade e peso inválido só depois de tentar salvar.
export function errosDosDados(campos, tentouSalvar, hoje = hojeISO()) {
  const { naoSeiData, dataNascimento, idadeAnos, idadeMeses, peso } = campos;
  const erros = { data: "", idade: "", peso: "" };

  if (!naoSeiData) {
    if (!dataNascimento) {
      if (tentouSalvar) erros.data = "Informe a data de nascimento ou marque que não sabe.";
    } else if (dataNascimento.length === 10 || tentouSalvar) {
      erros.data = validarData(dataNascimento);
      if (!erros.data && paraDataISO(dataNascimento) > hoje) {
        erros.data = "A data de nascimento não pode ser depois de hoje.";
      } else if (!erros.data && dataNascimento.slice(6) < "1900") {
        erros.data = "Data inválida: o ano precisa ser 1900 ou depois.";
      }
    }
  } else if (Number(idadeMeses) > 11) {
    erros.idade = "Os meses vão de 0 a 11. Ex.: 14 meses = 1 ano e 2 meses.";
  } else if (tentouSalvar && !Number(idadeAnos) && !Number(idadeMeses)) {
    erros.idade = "Informe a idade aproximada.";
  }

  if (tentouSalvar && peso && !pesoDigitado(peso)) {
    erros.peso = "Peso inválido. Ex: 4,2";
  }

  return erros;
}

// Formulário usado para CADASTRAR um pet (sem petInicial)
// e para ALTERAR um pet (com petInicial = os dados que vieram do banco).
export default function FormularioPet({
  usuarioId,
  petInicial,
  aoSalvar,
  gavetaInicial = "dados",
}) {
  const editando = Boolean(petInicial);

  const [nome, setNome] = useState(petInicial?.nome || "");
  const [especie, setEspecie] = useState(petInicial?.especie || "");
  const [raca, setRaca] = useState(petInicial?.raca || "");
  const [coloracao, setColoracao] = useState(petInicial?.coloracao || "");
  // O campo mostra o último peso salvo (ex.: 4.2 → "4,2")
  const pesoInicial = ultimoPeso(petInicial?.pesos);
  const [peso, setPeso] = useState(
    pesoInicial ? String(pesoInicial.peso).replace(".", ",") : ""
  );
  const [unidadePeso, setUnidadePeso] = useState(pesoInicial?.unidade || "kg");
  const [sexo, setSexo] = useState(petInicial?.sexo || "");
  const [castrado, setCastrado] = useState(
    editando ? textoCastrado(petInicial.castrado) : ""
  );
  // Pet com data estimada (ou sem data nenhuma): abre com "Não sei a data exata" marcado
  const estimada =
    editando && (petInicial.nascimento_estimado || !petInicial.data_nascimento);
  // Ao alterar um pet com data estimada, calcula de volta os anos e meses de hoje
  const idadeInicial =
    estimada && petInicial.data_nascimento
      ? idadeEmAnosEMeses(petInicial.data_nascimento)
      : null;

  const [naoSeiData, setNaoSeiData] = useState(estimada);
  const [dataNascimento, setDataNascimento] = useState(
    estimada ? "" : deDataISO(petInicial?.data_nascimento)
  );
  const [idadeAnos, setIdadeAnos] = useState(
    idadeInicial ? String(idadeInicial.anos) : ""
  );
  const [idadeMeses, setIdadeMeses] = useState(
    idadeInicial ? String(idadeInicial.meses) : ""
  );
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(petInicial?.foto_url || null);
  const [fotoParaAjustar, setFotoParaAjustar] = useState(null);
  const [erroFoto, setErroFoto] = useState("");
  // Foto do iPhone (HEIC) demora uns segundos para converter
  const [abrindoFoto, setAbrindoFoto] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Gavetas: normalmente "Dados do animal" começa aberta e "Histórico clínico" fechada.
  // O lápis do Histórico clínico (no perfil do pet) abre direto no histórico.
  const [dadosAberta, setDadosAberta] = useState(gavetaInicial === "dados");
  const [historicoAberto, setHistoricoAberto] = useState(
    gavetaInicial === "historico"
  );

  // Alergias, cirurgias, doenças anteriores, medicações, vermifugação,
  // antiparasitário e observações (ver HistoricoClinico.jsx)
  const [historico, setHistorico] = useState(historicoInicial(petInicial));
  // Cadastro de pet novo: arquivos da carteirinha que sobem depois de salvar o pet
  const [carteirinhasPendentes, setCarteirinhasPendentes] = useState([]);

  // true depois do 1º clique em Salvar: aí os campos vazios também avisam
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const camposDigitados = { naoSeiData, dataNascimento, idadeAnos, idadeMeses, peso };
  const errosCampos = errosDosDados(camposDigitados, tentouSalvar);

  // Erro em algum dado do animal: abre a gaveta para a pessoa ver o campo
  function erroNosDados(mensagem) {
    setErro(mensagem);
    setDadosAberta(true);
  }

  function erroNoHistorico(mensagem) {
    setErro(mensagem);
    setHistoricoAberto(true);
  }

  // Ao escolher a foto, abre primeiro a janela de ajuste (AjustarFoto).
  async function escolherFoto(evento) {
    const arquivo = evento.target.files[0];
    // Limpa o campo para dar para escolher a mesma foto de novo depois
    evento.target.value = "";
    if (!arquivo) return;
    setErroFoto("");
    setAbrindoFoto(true);
    try {
      setFotoParaAjustar(await abrirFotoEscolhida(arquivo));
    } catch (falha) {
      console.error(falha);
      setErroFoto(AVISO_FOTO); // aparece logo embaixo da foto
    } finally {
      setAbrindoFoto(false);
    }
  }

  function usarFotoAjustada(arquivoRecortado) {
    setFoto(arquivoRecortado);
    setFotoPreview(URL.createObjectURL(arquivoRecortado));
    setFotoParaAjustar(null);
  }

  async function salvar() {
    setErro("");
    setTentouSalvar(true);

    if (!nome || !especie || !raca || !sexo || !castrado) {
      erroNosDados("Preencha nome, espécie, raça, sexo e se é castrado.");
      return;
    }

    // Data, idade e peso: o aviso aparece embaixo do próprio campo
    const errosAoSalvar = errosDosDados(camposDigitados, true);
    if (errosAoSalvar.data || errosAoSalvar.idade || errosAoSalvar.peso) {
      setDadosAberta(true); // abre a gaveta para a pessoa ver o campo
      setErro("Confira os campos marcados em vermelho em Dados do animal.");
      return;
    }

    const anos = Number(idadeAnos || 0);
    const meses = Number(idadeMeses || 0);
    const pesoNumero = pesoDigitado(peso);

    const alergias = itensPreenchidos(historico.alergias);
    const cirurgias = itensPreenchidos(historico.cirurgias);

    if (historico.temAlergia && !alergias.length) {
      erroNoHistorico("Escreva qual é a alergia ou marque Não.");
      return;
    }

    const doencasEmTratamento = doencasPreenchidas(historico.doencasEmTratamento);
    if (historico.temDoencasEmTratamento && !doencasEmTratamento.length) {
      erroNoHistorico("Escreva qual é a doença em tratamento ou marque Não.");
      return;
    }

    // As medicações ficam ligadas à doença pelo nome: não pode repetir
    const nomesDoencas = doencasEmTratamento.map((item) => item.doenca.toLowerCase());
    if (historico.temDoencasEmTratamento && new Set(nomesDoencas).size !== nomesDoencas.length) {
      erroNoHistorico("Tem doença em tratamento repetida. Deixe cada doença uma vez só.");
      return;
    }

    const doencasAnteriores = doencasPreenchidas(historico.doencasAnteriores);
    if (historico.temDoencasAnteriores && !doencasAnteriores.length) {
      erroNoHistorico("Escreva qual foi a doença ou marque Não.");
      return;
    }

    // Data do diagnóstico (opcional): confere só nas listas marcadas com Sim
    const erroDataDoenca =
      (historico.temDoencasEmTratamento && erroNasDatasDoencas(historico.doencasEmTratamento)) ||
      (historico.temDoencasAnteriores && erroNasDatasDoencas(historico.doencasAnteriores));
    if (erroDataDoenca) {
      erroNoHistorico(erroDataDoenca);
      return;
    }

    // Cartão de doença em tratamento com algo preenchido, mas sem o nome da doença
    const doencaSemNome =
      historico.temDoencasEmTratamento &&
      historico.doencasEmTratamento.some(
        (item) => !item.doenca.trim() && (item.diagnostico || item.temMedicacao != null) // != pega null e undefined
      );
    if (doencaSemNome) {
      erroNoHistorico("Escreva o nome de cada doença em tratamento (ou remova o cartão em branco).");
      return;
    }

    // Medicações de uso contínuo: ficam dentro de cada doença em tratamento.
    // Marcou "Não" (na doença ou nas doenças): as medicações dela não são salvas
    const doencasComMedicacao = historico.temDoencasEmTratamento
      ? historico.doencasEmTratamento.filter((item) => item.doenca.trim() && item.temMedicacao)
      : [];
    for (const item of doencasComMedicacao) {
      if (!item.medicacoes.some((med) => med.nome.trim())) {
        erroNoHistorico(`${item.doenca.trim()}: escreva o nome da medicação ou marque Não.`);
        return;
      }
    }
    const medicacoes = medicacoesDasDoencas(doencasComMedicacao);

    // Medicação com algo preenchido mas sem nome: pede o nome
    const medicacaoSemNome = medicacoes.some(
      ({ id, nome, doenca, intervalo, intervaloTempo, duracaoTempo, ...resto }) =>
        !nome.trim() && Object.values(resto).some(Boolean)
    );
    if (medicacaoSemNome) {
      erroNoHistorico("Escreva o nome de cada medicação (ou remova a que está em branco).");
      return;
    }

    // Data da última dose (só nas medicações de semana, mês ou ano)
    for (const med of medicacoes) {
      if (!med.nome.trim() || !TEMPOS_COM_LEMBRETE.includes(med.intervaloTempo)) continue;
      if (!med.ultimaDose) continue;
      const erroData = validarData(med.ultimaDose);
      if (erroData) {
        erroNoHistorico(`${med.nome}: ${erroData}`);
        return;
      }
      if (paraDataISO(med.ultimaDose) > hojeISO()) {
        erroNoHistorico(`${med.nome}: a data da última dose não pode ser no futuro.`);
        return;
      }
    }

    // Outros medicamentos (os que não são de doença em tratamento)
    const erroOutros = erroNasMedicacoes(historico.outrosMedicamentos);
    if (erroOutros) {
      erroNoHistorico(`Outros medicamentos: ${erroOutros}`);
      return;
    }

    // Testes de FIV e FeLV (só gatos)
    if (especie === "Felino") {
      for (const [nomeTeste, teste] of [
        ["FIV", historico.testeFiv],
        ["FeLV", historico.testeFelv],
      ]) {
        if (teste.testado && !teste.registros.length) {
          erroNoHistorico(`Teste de ${nomeTeste}: registre o resultado ou marque Não.`);
          return;
        }
      }
    }

    if (historico.temCirurgia && !cirurgias.length) {
      erroNoHistorico("Escreva qual foi a cirurgia ou marque Não.");
      return;
    }

    setEnviando(true);

    // Sem foto nova: mantém a que o pet já tinha (ou nenhuma)
    let fotoUrl = petInicial?.foto_url || null;

    if (foto) {
      // foto.name já vem simples do AjustarFoto (ex.: 1729700000000.jpg)
      const nomeArquivo = `${usuarioId}/${foto.name}`;
      const { error: erroUpload } = await supabase.storage
        .from("fotos-pets")
        .upload(nomeArquivo, foto);

      if (erroUpload) {
        console.error(erroUpload);
        setErro("Não foi possível enviar a foto. Tente de novo.");
        setEnviando(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("fotos-pets")
        .getPublicUrl(nomeArquivo);
      fotoUrl = urlData.publicUrl;
    }

    const dados = {
      nome,
      especie,
      raca,
      // Coloração é opcional: campo vazio fica sem valor no banco
      coloracao: coloracao.trim() || null,
      // Peso é opcional. Campo vazio não apaga as pesagens antigas (histórico)
      pesos: pesoNumero
        ? pesosParaSalvar(petInicial?.pesos || [], pesoNumero, unidadePeso)
        : petInicial?.pesos || [],
      sexo,
      // "Não definido" fica vazio (null) no banco
      castrado: castrado === "Sim" ? true : castrado === "Não" ? false : null,
      // Sem a data exata, salva uma data estimada a partir dos anos e meses
      data_nascimento: naoSeiData
        ? dataEstimada(anos, meses)
        : paraDataISO(dataNascimento),
      nascimento_estimado: naoSeiData,
      foto_url: fotoUrl,
      // Histórico clínico. Marcou "Não": a lista fica vazia
      tem_alergia: historico.temAlergia,
      alergias: historico.temAlergia ? alergias : [],
      tem_cirurgia: historico.temCirurgia,
      cirurgias: historico.temCirurgia ? cirurgias : [],
      tem_doencas_em_tratamento: historico.temDoencasEmTratamento,
      // As medicações de cada doença vão em "medicacoes" (com o nome da doença);
      // aqui fica só se a doença tem medicação (Sim/Não)
      doencas_em_tratamento: historico.temDoencasEmTratamento
        ? historico.doencasEmTratamento
            .filter((item) => item.doenca.trim())
            .map((item) => {
              const { doenca, diagnostico } = doencasPreenchidas([item])[0];
              return { doenca, diagnostico, temMedicacao: item.temMedicacao ?? null };
            })
        : [],
      tem_doencas_anteriores: historico.temDoencasAnteriores,
      // Só os nomes (para listas e buscas) e os detalhes com os medicamentos
      doencas_anteriores: historico.temDoencasAnteriores
        ? doencasAnteriores.map((item) => item.doenca)
        : [],
      doencas_anteriores_detalhes: historico.temDoencasAnteriores ? doencasAnteriores : [],
      tem_medicacoes: medicacoes.some((med) => med.nome.trim()),
      // Só as medicações com nome; o id é só da tela e não vai para o banco
      medicacoes: medicacoes
        .filter((med) => med.nome.trim())
        .map(({ id, ...med }) => ({
          ...med,
          nome: med.nome.trim(),
          // Guarda a data só quando ela serve para o lembrete
          ultimaDose:
            TEMPOS_COM_LEMBRETE.includes(med.intervaloTempo) && med.ultimaDose
              ? paraDataISO(med.ultimaDose)
              : null,
        })),
      vermifugacoes: historico.vermifugacoes,
      antiparasitarios: historico.antiparasitarios,
      vacinas: historico.vacinas,
      // Só os com nome. registradoEm: o dia em que entrou no histórico (com a
      // duração, o perfil do pet sabe até quando o remédio vai)
      outros_medicamentos: historico.outrosMedicamentos
        .filter((med) => med.nome.trim())
        .map((med) => ({ ...medicacaoParaSalvar(med), registradoEm: med.registradoEm || hojeISO() })),
      exames: historico.exames,
      // Só gatos. "Não" apaga o resultado e a data
      testes_felinos:
        especie === "Felino"
          ? {
              fiv: testeParaSalvar(historico.testeFiv),
              felv: testeParaSalvar(historico.testeFelv),
            }
          : null,
      observacoes: historico.observacoes.trim() || null,
    };

    // .select("id") devolve as linhas que o banco gravou de verdade
    const { data: gravados, error } = editando
      ? await supabase
          .from("pets")
          .update(dados)
          .eq("id", petInicial.id)
          .eq("tutor_id", usuarioId)
          .select("id")
      : await supabase.from("pets").insert({ ...dados, tutor_id: usuarioId }).select("id");

    // Pet novo salvo: agora ele tem id, então envia a carteirinha escolhida no cadastro.
    // Se falhar, o pet continua salvo e a tela Meus Animais mostra o aviso.
    let aviso = "";
    if (!editando && gravados?.length) {
      for (const arquivo of carteirinhasPendentes) {
        const { error: erroEnvio } = await supabase.storage
          .from(PASTA_DOCUMENTOS)
          .upload(caminhoCarteirinha(usuarioId, gravados[0].id, arquivo), arquivo, {
            contentType: tipoDoArquivo(arquivo),
          });
        if (erroEnvio) {
          console.error(erroEnvio);
          aviso =
            "O pet foi salvo, mas a carteirinha não foi enviada. Anexe de novo pelo lápis do Histórico clínico.";
        }
      }
    }

    setEnviando(false);

    // Sem erro mas sem linha gravada = o banco bloqueou (regra de segurança)
    if (error || !gravados?.length) {
      if (error) console.error(error);
      setErro("Não foi possível salvar. Tente de novo.");
      // A foto nova já tinha subido: apaga, para não ficar perdida na pasta
      if (foto) await apagarFoto(fotoUrl);
      return;
    }

    // Trocou a foto: apaga a antiga da pasta
    if (foto && petInicial?.foto_url) apagarFoto(petInicial.foto_url);

    aoSalvar(aviso);
  }

  // Apaga uma foto da pasta fotos-pets pelo link (se der erro, não atrapalha o salvar)
  async function apagarFoto(link) {
    const caminho = link?.split("/fotos-pets/")[1];
    if (!caminho) return;
    const { error } = await supabase.storage.from("fotos-pets").remove([caminho]);
    if (error) console.error(error);
  }

  const racasSugeridas =
    racasPorEspecie[especie] || Object.values(racasPorEspecie).flat();

  return (
    <div className="login-form">
      <Gaveta
        titulo="Dados do animal"
        aberta={dadosAberta}
        aoAlternar={() => setDadosAberta(!dadosAberta)}
      >
        {/* Foto no estilo de perfil: o círculo inteiro é o botão de escolher a foto.
            O <input type="file"> fica escondido dentro do <label>. */}
        <label className="pet-foto-circulo">
          <input
            type="file"
            accept="image/*"
            onChange={escolherFoto}
            disabled={abrindoFoto}
            className="pet-foto-input"
          />
          {fotoPreview ? (
            <img src={fotoPreview} alt="Foto do pet" className="pet-foto-imagem" />
          ) : (
            <span className="pet-foto-vazia">
              <IoCameraOutline />
            </span>
          )}
          <span className="pet-foto-texto">
            {abrindoFoto ? "Abrindo foto..." : fotoPreview ? "Trocar foto" : "Adicionar foto"}
          </span>
        </label>
        {erroFoto && <span className="aviso-cpf">{erroFoto}</span>}

        {fotoParaAjustar && (
          <AjustarFoto
            imagem={fotoParaAjustar}
            aoConfirmar={usarFotoAjustada}
            aoCancelar={() => setFotoParaAjustar(null)}
          />
        )}

        <p className="obrigatorio-legenda">
          <span className="obrigatorio">*</span> Campos obrigatórios
        </p>

        <label>
          <span>
            Nome <span className="obrigatorio">*</span>
          </span>
          <input
            type="text"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
          />
        </label>

        <label>
          <span>
            Espécie <span className="obrigatorio">*</span>
          </span>
          <SelectCostumizado
            label="Selecione a espécie"
            opcoes={especies}
            valor={especie}
            aoEscolher={(valor) => {
              if (especie && especie !== valor) {
                setRaca("");
              }
              setEspecie(valor);
            }}
          />
        </label>

        <label>
          <span>
            {especie === "Silvestres e exóticos" || especie === "Aves"
              ? "Tipo de animal"
              : "Raça"}{" "}
            <span className="obrigatorio">*</span>
          </span>
          <CampoAutocomplete
            valor={raca}
            aoDigitar={setRaca}
            opcoes={racasSugeridas}
            placeholder={
              racasSugeridas.length ? "Comece a digitar..." : "Ex: Vira-lata"
            }
          />
        </label>

        <label>
          Coloração
          <input
            type="text"
            value={coloracao}
            onChange={(evento) => setColoracao(evento.target.value)}
            placeholder="Ex: Preto e branco"
            maxLength={60}
          />
        </label>

        <div className="pet-idade">
          <span className="pet-idade-titulo">Peso</span>
          <div className="med-linha">
            <input
              type="text"
              inputMode="decimal"
              className={errosCampos.peso ? "med-numero campo-invalido" : "med-numero"}
              aria-label="Peso"
              value={peso}
              maxLength={6}
              onChange={(evento) =>
                // Só números e uma vírgula
                setPeso(
                  evento.target.value.replace(/[^\d,]/g, "").replace(/(,.*),/g, "$1")
                )
              }
            />
            <ListaOpcoes opcoes={UNIDADES_PESO} valor={unidadePeso} aoMudar={setUnidadePeso} />
          </div>
          {errosCampos.peso && <span className="aviso-cpf">{errosCampos.peso}</span>}
        </div>

        <label>
          <span>
            Sexo <span className="obrigatorio">*</span>
          </span>
          <SelectCostumizado
            label="Selecione"
            opcoes={["Fêmea", "Macho"]}
            valor={sexo}
            aoEscolher={(valor) => setSexo(valor)}
          />
        </label>

        <label>
          <span>
            Castrado? <span className="obrigatorio">*</span>
          </span>
          <SelectCostumizado
            label="Selecione"
            opcoes={["Sim", "Não", "Não definido"]}
            valor={castrado}
            aoEscolher={(valor) => setCastrado(valor)}
          />
        </label>

        {!naoSeiData && (
          <label>
            <span>
              Data de nascimento <span className="obrigatorio">*</span>
            </span>
            <input
              type="text"
              value={dataNascimento}
              onChange={(evento) =>
                setDataNascimento(formatarData(evento.target.value))
              }
              placeholder="DD/MM/AAAA"
              maxLength={10}
              inputMode="numeric"
              className={errosCampos.data ? "campo-invalido" : ""}
            />
            {errosCampos.data && <span className="aviso-cpf">{errosCampos.data}</span>}
          </label>
        )}

        <label className="animais-checkbox">
          <input
            type="checkbox"
            checked={naoSeiData}
            onChange={(evento) => setNaoSeiData(evento.target.checked)}
            // O checkbox só marca com o Espaço; aqui o Enter também marca e desmarca
            onKeyDown={(evento) => {
              if (evento.key === "Enter") {
                evento.preventDefault();
                setNaoSeiData(!naoSeiData);
              }
            }}
          />
          Não sei a data exata
        </label>

        {naoSeiData && (
          <div className="pet-idade">
            <span className="pet-idade-titulo">
              Idade aproximada <span className="obrigatorio">*</span>
            </span>
            <div className="pet-idade-campos">
              <label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="0"
                  value={idadeAnos}
                  className={errosCampos.idade ? "campo-invalido" : ""}
                  onChange={(evento) =>
                    setIdadeAnos(evento.target.value.replace(/\D/g, ""))
                  }
                />
                {Number(idadeAnos) === 1 ? "ano" : "anos"}
              </label>
              <label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="0"
                  value={idadeMeses}
                  className={errosCampos.idade ? "campo-invalido" : ""}
                  onChange={(evento) =>
                    setIdadeMeses(evento.target.value.replace(/\D/g, ""))
                  }
                />
                {Number(idadeMeses) === 1 ? "mês" : "meses"}
              </label>
            </div>
            {errosCampos.idade && <span className="aviso-cpf">{errosCampos.idade}</span>}
          </div>
        )}
      </Gaveta>

      <Gaveta
        titulo="Histórico clínico"
        aberta={historicoAberto}
        aoAlternar={() => setHistoricoAberto(!historicoAberto)}
      >
        <HistoricoClinico
          historico={historico}
          aoMudar={setHistorico}
          especie={especie}
          tutorId={usuarioId}
          petId={petInicial?.id}
          carteirinhasPendentes={carteirinhasPendentes}
          aoMudarCarteirinhasPendentes={setCarteirinhasPendentes}
        />
      </Gaveta>

      {erro && <span className="aviso-cpf">{erro}</span>}

      <button className="botao-login" onClick={salvar} disabled={enviando}>
        {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Salvar pet"}
      </button>
    </div>
  );
}
