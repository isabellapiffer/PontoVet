import { useState } from "react";
import TelaAdicionar, { EscolherPet, Alternador, Escolhas } from "./TelaAdicionar.jsx";
import Medicacoes, {
  UNIDADES_DOSE,
  medicacaoVazia,
  erroNasMedicacoes,
  medicacaoParaSalvar,
  soDose,
} from "./Medicacoes.jsx";
import CampoData from "./CampoData.jsx";
import ListaOpcoes from "./ListaOpcoes.jsx";
import { validarData, paraDataISO, deDataISO } from "../formatadores.js";
import { hojeISO, somarIntervalo } from "../lembretes.js";
import "./historicoclinico.css";
import "./medicacoes.css";
import "../paginas/login.css";

// "Remédio" do "+" da Agenda (protótipo de 05/11/2026). Três tipos:
// - Medicamento: com Diagnóstico preenchido (vai para "medicacoes", ligado à doença
//   em tratamento) ou sem (vai para "outros_medicamentos")
// - Vermífugo e Antipulgas e carrapatos: registrar (vai para o histórico do pet)
//   ou agendar (vai para a tabela compromissos)

const TIPOS_REMEDIO = [
  ["medicamento", "Medicamento", "remédio para tratar uma doença ou sintoma"],
  ["vermifugo", "Vermífugo", "contra vermes do intestino"],
  ["antiparasitario", "Antipulgas e carrapatos", "contra pulgas, carrapatos e outros parasitas da pele"],
];

// "Repetir em": [texto do botão, quantidade, tempo]
const REPETIR = [
  ["15 dias", 15, "dia"],
  ["21 dias", 21, "dia"],
  ["3 meses", 3, "mes"],
  ["4 meses", 4, "mes"],
  ["6 meses", 6, "mes"],
  ["1 ano", 1, "ano"],
];

// Máximo de itens em cada lista (igual ao check do banco em supabase/colunas-pets.sql).
// Passou disso, o banco recusa; aqui a gente avisa antes com uma mensagem clara
const LIMITE_MEDICACOES = 20;
const LIMITE_OUTROS_MEDICAMENTOS = 50;

// Próxima dose ("2027-02-05"), ou "" se ainda não dá para calcular
function calcularProxima(data, repetir) {
  const opcao = REPETIR.find(([texto]) => texto === repetir);
  if (!opcao || validarData(data)) return "";
  return somarIntervalo(paraDataISO(data), opcao[1], opcao[2]);
}

// pets, petId, aoEscolherPet: o pet escolhido fica no AdicionarNaAgenda
// salvarNoPet(colunas, montar) e salvarNaAgenda(dados): gravam no banco e
// devolvem true se deu certo (ver AdicionarNaAgenda)
export default function NovoRemedio({
  pets,
  petId,
  aoEscolherPet,
  diaInicial,
  aoVoltar,
  salvarNoPet,
  salvarNaAgenda,
}) {
  const [tipoRemedio, setTipoRemedio] = useState("");
  const [verExplicacao, setVerExplicacao] = useState(false);

  // Medicamento
  const [doenca, setDoenca] = useState(""); // Diagnóstico ("" = não informado)
  const [medicacoes, setMedicacoes] = useState([medicacaoVazia()]);

  // Vermífugo e antipulgas
  const [modo, setModo] = useState("registrar");
  const [produto, setProduto] = useState("");
  const [dose, setDose] = useState("");
  const [unidade, setUnidade] = useState("");
  const [dataDada, setDataDada] = useState("");
  const [repetir, setRepetir] = useState("");
  const [dataAgendada, setDataAgendada] = useState(deDataISO(diaInicial));
  const [hora, setHora] = useState("");

  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const pet = pets.find((p) => p.id === petId) || null;
  // As doenças em tratamento do pet viram botões ("Dermatite", "Otite"...)
  // O Set tira as repetidas ("Otite" duas vezes vira um botão só) e o filter as vazias
  const doencasDoPet = [
    ...new Set((pet?.doencas_em_tratamento || []).map((item) => item?.doenca).filter(Boolean)),
  ];
  const proxima = calcularProxima(dataDada, repetir);

  function escolherPet(id) {
    aoEscolherPet(id);
    setDoenca(""); // as doenças mudam de um pet para outro
  }

  function escolherTipo(tipo) {
    setErro("");
    setTipoRemedio(tipo);
  }

  // Medicamento: devolve a mensagem de erro, ou "" se estiver tudo certo
  function conferirMedicamento() {
    if (!medicacoes.some((med) => med.nome.trim())) return "Escreva o nome da medicação.";
    return erroNasMedicacoes(medicacoes);
  }

  async function salvarMedicamento() {
    const novas = medicacoes.filter((med) => med.nome.trim()).map(medicacaoParaSalvar);

    const nomeDigitado = doenca.trim();

    if (!nomeDigitado) {
      // Sem diagnóstico: vai para "Outros medicamentos".
      // registradoEm: com ele e a duração, o histórico sabe até quando o remédio vai
      return salvarNoPet(["outros_medicamentos"], (atual) => {
        const lista = atual.outros_medicamentos || [];
        // Com as novas, passaria do limite: devolve o aviso em vez de gravar
        if (lista.length + novas.length > LIMITE_OUTROS_MEDICAMENTOS) {
          return `Limite de ${LIMITE_OUTROS_MEDICAMENTOS} medicações neste pet.`;
        }
        return {
          outros_medicamentos: [
            ...lista,
            ...novas.map((med) => ({ ...med, registradoEm: hojeISO() })),
          ],
        };
      });
    }

    return salvarNoPet(["medicacoes", "doencas_em_tratamento"], (atual) => {
      // Com as novas, passaria do limite: devolve o aviso em vez de gravar
      if ((atual.medicacoes || []).length + novas.length > LIMITE_MEDICACOES) {
        return `Limite de ${LIMITE_MEDICACOES} medicações neste pet.`;
      }
      const doencas = atual.doencas_em_tratamento || [];
      // Diagnóstico com o nome de uma doença que já existe (ex.: "otite" e "Otite"):
      // usa a que já existe, para não repetir
      const existente = doencas.find(
        (item) => item?.doenca?.toLowerCase() === nomeDigitado.toLowerCase()
      );
      const nomeDoenca = existente ? existente.doenca : nomeDigitado;

      return {
        tem_doencas_em_tratamento: true,
        tem_medicacoes: true,
        // A doença fica marcada com "Sim" em "Faz o uso de medicação contínua?";
        // sem isso, ao salvar o cadastro do pet, as medicações dela seriam apagadas
        doencas_em_tratamento: existente
          ? doencas.map((item) => (item === existente ? { ...item, temMedicacao: true } : item))
          : [...doencas, { doenca: nomeDoenca, diagnostico: null, temMedicacao: true }],
        // As medicações ficam ligadas à doença pelo nome (igual ao cadastro do pet)
        medicacoes: [
          ...(atual.medicacoes || []),
          ...novas.map((med) => ({ ...med, doenca: nomeDoenca })),
        ],
      };
    });
  }

  // Vermífugo ou antipulgas: confere os campos do modo escolhido
  function conferirPrevencao() {
    if (!produto.trim()) return "Escreva o nome do produto.";
    const data = modo === "registrar" ? dataDada : dataAgendada;
    const erroData = validarData(data);
    if (erroData) return erroData;
    if (modo === "registrar" && paraDataISO(data) > hojeISO()) {
      return "A data não pode ser no futuro.";
    }
    return "";
  }

  async function salvarPrevencao() {
    if (modo === "agendar") {
      return salvarNaAgenda({
        tipo: tipoRemedio, // "vermifugo" ou "antiparasitario"
        titulo: produto.trim(),
        data: paraDataISO(dataAgendada),
        hora: hora || null,
      });
    }

    // Mesmo formato do "+ Registrar vermifugação" do histórico
    const registro = {
      produto: produto.trim(),
      dose,
      unidade,
      data: paraDataISO(dataDada),
      proxima: proxima || null,
      autor: "tutor",
    };
    const coluna = tipoRemedio === "vermifugo" ? "vermifugacoes" : "antiparasitarios";
    return salvarNoPet([coluna], (atual) => ({ [coluna]: [...(atual[coluna] || []), registro] }));
  }

  async function salvar() {
    if (salvando) return;
    setErro("");

    if (!petId) {
      setErro("Escolha o pet.");
      return;
    }
    const erroCampos = tipoRemedio === "medicamento" ? conferirMedicamento() : conferirPrevencao();
    if (erroCampos) {
      setErro(erroCampos);
      return;
    }

    setSalvando(true);
    const resultado =
      tipoRemedio === "medicamento" ? await salvarMedicamento() : await salvarPrevencao();

    // true: deu certo, a Agenda fecha esta tela. Texto: aviso (ex.: limite de
    // medicações). false: erro. Nos dois últimos, mostra o aviso e deixa tentar de novo
    if (resultado !== true) {
      setErro(typeof resultado === "string" ? resultado : "Não foi possível salvar. Tente de novo.");
      setSalvando(false);
    }
  }

  const vaiParaAgenda = tipoRemedio !== "medicamento" && modo === "agendar";

  return (
    <TelaAdicionar
      titulo="Novo remédio"
      aoVoltar={aoVoltar}
      rodape={
        tipoRemedio && (
          <button className="add-salvar" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : vaiParaAgenda ? "Salvar na agenda" : "Salvar no histórico"}
          </button>
        )
      }
    >
      <EscolherPet pets={pets} petId={petId} aoEscolher={escolherPet} />

      {/* Tipo de remédio, com o ⓘ que abre e fecha a explicação de cada um */}
      <div className="add-campo">
        <div className="add-rotulo-linha">
          <span className="add-rotulo">
            Que tipo de remédio? <span className="obrigatorio">*</span>
          </span>
          <button
            type="button"
            className="add-info"
            aria-label="O que é cada tipo"
            aria-expanded={verExplicacao}
            onClick={() => setVerExplicacao(!verExplicacao)}
          >
            <i className="fa-solid fa-circle-info"></i>
          </button>
        </div>

        {verExplicacao && (
          <div className="add-explicacao">
            {TIPOS_REMEDIO.map(([id, nome, explicacao]) => (
              <p key={id}>
                <strong>{nome}:</strong> {explicacao}
              </p>
            ))}
          </div>
        )}

        <Escolhas
          opcoes={TIPOS_REMEDIO.map(([id, nome]) => [id, nome])}
          valor={tipoRemedio}
          aoEscolher={escolherTipo}
        />
      </div>

      {/* ---------- Medicamento ---------- */}
      {tipoRemedio === "medicamento" && (
        <>
          {/* Diagnóstico (opcional): as doenças em tratamento do pet viram botões;
              tocar num botão escreve o nome no campo */}
          <div className="add-campo">
            <label className="add-rotulo" htmlFor="diagnostico">
              Diagnóstico
            </label>
            {doencasDoPet.length > 0 && (
              <Escolhas opcoes={doencasDoPet} valor={doenca} aoEscolher={setDoenca} />
            )}
            <input
              id="diagnostico"
              type="text"
              className="add-input"
              maxLength={100}
              placeholder="Ex: Dermatite"
              value={doenca}
              onChange={(evento) => setDoenca(evento.target.value)}
            />
          </div>

          {/* Os mesmos campos de medicação do histórico do pet, já abertos */}
          <div className="login-form">
            <Medicacoes embutida medicacoes={medicacoes} aoMudar={setMedicacoes} />
          </div>
        </>
      )}

      {/* ---------- Vermífugo e Antipulgas e carrapatos ---------- */}
      {(tipoRemedio === "vermifugo" || tipoRemedio === "antiparasitario") && (
        <>
          <Alternador
            rotulo="Registrar ou agendar a administração"
            opcoes={[
              ["registrar", "Registrar administração"],
              ["agendar", "Agendar administração"],
            ]}
            valor={modo}
            aoMudar={(valor) => {
              setErro("");
              setModo(valor);
            }}
          />

          <label className="add-campo">
            <span className="add-rotulo">
              {tipoRemedio === "vermifugo" ? "Qual vermífugo?" : "Qual produto?"}{" "}
              <span className="obrigatorio">*</span>
            </span>
            <input
              type="text"
              className="add-input"
              maxLength={60}
              placeholder={tipoRemedio === "vermifugo" ? "Ex: Drontal" : "Ex: Bravecto"}
              value={produto}
              onChange={(evento) => setProduto(evento.target.value)}
            />
          </label>

          {modo === "registrar" && (
            <>
              {/* Dose com a unidade, igual ao "+ Registrar vermifugação" do histórico */}
              <div className="login-form">
                <div className="med-campo">
                  <span className="med-rotulo">Dose</span>
                  <div className="med-linha">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="med-numero med-numero-largo"
                      aria-label="Dose"
                      value={dose}
                      maxLength={6}
                      onChange={(evento) => setDose(soDose(evento.target.value))}
                    />
                    <ListaOpcoes opcoes={UNIDADES_DOSE} valor={unidade} aoMudar={setUnidade} />
                  </div>
                </div>
              </div>

              <div className="add-campo">
                <span className="add-rotulo">
                  Data em que foi administrado <span className="obrigatorio">*</span>
                </span>
                <CampoData valor={dataDada} aoMudar={setDataDada} />
              </div>

              <div className="add-campo">
                <span className="add-rotulo">Repetir em</span>
                <Escolhas
                  opcoes={REPETIR.map(([texto]) => texto)}
                  valor={repetir}
                  // Tocar de novo no escolhido desmarca (o campo não é obrigatório)
                  aoEscolher={(texto) => setRepetir(texto === repetir ? "" : texto)}
                />
                {proxima && <span className="add-destaque">Próxima dose: {deDataISO(proxima)}</span>}
              </div>
            </>
          )}

          {modo === "agendar" && (
            <>
              <div className="add-campo">
                <span className="add-rotulo">
                  Data agendada <span className="obrigatorio">*</span>
                </span>
                <CampoData valor={dataAgendada} aoMudar={setDataAgendada} permitirFuturo />
              </div>

              <label className="add-campo">
                <span className="add-rotulo">Hora</span>
                <input
                  type="time"
                  className="add-input add-input-hora"
                  value={hora}
                  onChange={(evento) => setHora(evento.target.value)}
                />
              </label>
            </>
          )}
        </>
      )}

      {erro && <span className="aviso-cpf">{erro}</span>}
    </TelaAdicionar>
  );
}
