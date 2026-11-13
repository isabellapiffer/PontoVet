import { useState } from "react";
import TelaAdicionar, { EscolherPet, Alternador, Escolhas } from "./TelaAdicionar.jsx";
import { SimNao } from "./HistoricoClinico.jsx";
import CampoData from "./CampoData.jsx";
import { validarData, paraDataISO, deDataISO } from "../formatadores.js";
import { hojeISO, horariosDoPreparo } from "../lembretes.js";
import { TIPOS_EXAME } from "../exames.js";
import "./historicoclinico.css";
import "./medicacoes.css";
import "../paginas/login.css";

// "Exame" do "+" da Agenda (protótipo de 05/11/2026):
// - Registrar exame: já foi feito -> vai para o histórico do pet (coluna "exames")
// - Agendar exame: vai ser feito -> vai para a tabela compromissos, com o preparo
//   (jejum, remédio antes, outro), que vira aviso nos Lembretes

// "O app lembra: jejum a partir de 01:00 · Luftal às 08:00"
// (jejum que começa num dia antes do exame mostra o dia: "a partir de 22:00 de 11/11")
function textoDosHorarios(preparo, dataISO, hora) {
  const horarios = horariosDoPreparo(preparo, dataISO, hora);
  const partes = [];
  if (horarios.jejum) {
    const dia = horarios.jejum.data !== dataISO ? ` de ${deDataISO(horarios.jejum.data).slice(0, 5)}` : "";
    partes.push(`jejum a partir de ${horarios.jejum.hora}${dia}`);
  }
  if (horarios.medicamento) {
    partes.push(`${preparo.medicamento.nome} às ${horarios.medicamento.hora}`);
  }
  return partes.length ? `O app lembra: ${partes.join(" · ")}` : "";
}

// pets, petId, aoEscolherPet: o pet escolhido fica no AdicionarNaAgenda
// salvarNoPet(colunas, montar) e salvarNaAgenda(dados): gravam no banco e
// devolvem true se deu certo (ver AdicionarNaAgenda)
export default function NovoExame({
  pets,
  petId,
  aoEscolherPet,
  diaInicial,
  aoVoltar,
  salvarNoPet,
  salvarNaAgenda,
}) {
  const [modo, setModo] = useState("registrar");
  const [tipoExame, setTipoExame] = useState("");
  const [nomeOutro, setNomeOutro] = useState("");
  const [dataFeito, setDataFeito] = useState("");
  const [dataAgendada, setDataAgendada] = useState(deDataISO(diaInicial));
  const [hora, setHora] = useState("");
  const [local, setLocal] = useState("");
  const [resultado, setResultado] = useState("");

  // Preparo (só em Agendar)
  const [precisaPreparo, setPrecisaPreparo] = useState(null); // null = ainda não respondeu
  const [jejum, setJejum] = useState(false);
  const [jejumHoras, setJejumHoras] = useState("");
  const [darMedicamento, setDarMedicamento] = useState(false);
  const [medNome, setMedNome] = useState("");
  const [medInstrucao, setMedInstrucao] = useState("");
  const [outroPreparo, setOutroPreparo] = useState(false);
  const [outroTexto, setOutroTexto] = useState("");

  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // O preparo como vai para o banco (null = não precisa)
  function montarPreparo() {
    if (!precisaPreparo) return null;
    const preparo = {};
    if (jejum) preparo.jejumHoras = Number(jejumHoras);
    if (darMedicamento) {
      preparo.medicamento = { nome: medNome.trim(), instrucao: medInstrucao.trim() };
    }
    if (outroPreparo) preparo.outro = outroTexto.trim();
    return preparo;
  }

  // Devolve a mensagem de erro, ou "" se estiver tudo certo
  function conferir() {
    if (!petId) return "Escolha o pet.";
    if (!tipoExame) return "Escolha o exame.";
    if (tipoExame === "Outro" && !nomeOutro.trim()) return "Escreva o nome do exame.";

    const data = modo === "registrar" ? dataFeito : dataAgendada;
    const erroData = validarData(data);
    if (erroData) return erroData;
    if (modo === "registrar" && paraDataISO(data) > hojeISO()) {
      return "A data do exame não pode ser no futuro.";
    }

    if (modo === "agendar" && precisaPreparo) {
      if (!jejum && !darMedicamento && !outroPreparo) return "Marque o preparo ou escolha Não.";
      if (jejum && !(Number(jejumHoras) > 0)) return "Escreva quantas horas de jejum.";
      if (darMedicamento && !medNome.trim()) return "Escreva o nome do medicamento.";
      if (outroPreparo && !outroTexto.trim()) return "Escreva qual é o outro preparo.";
    }
    return "";
  }

  async function salvar() {
    if (salvando) return;
    setErro("");

    const erroCampos = conferir();
    if (erroCampos) {
      setErro(erroCampos);
      return;
    }

    // Botão "Outro": o nome é o que a pessoa escreveu; nos outros, o nome do botão
    const nome = tipoExame === "Outro" ? nomeOutro.trim() : tipoExame;

    setSalvando(true);
    let deuCerto;
    if (modo === "registrar") {
      const exame = {
        tipo: tipoExame,
        nome,
        data: paraDataISO(dataFeito),
        local: local.trim(),
        resultado: resultado.trim(),
        autor: "tutor", // depois o veterinário também vai registrar
      };
      deuCerto = await salvarNoPet(["exames"], (atual) => ({
        exames: [...(atual.exames || []), exame],
      }));
    } else {
      deuCerto = await salvarNaAgenda({
        tipo: "exame",
        titulo: nome,
        data: paraDataISO(dataAgendada),
        hora: hora || null,
        local: local.trim() || null,
        preparo: montarPreparo(),
      });
    }

    // Deu certo: a Agenda fecha esta tela. Deu errado: mostra o aviso e deixa tentar de novo
    if (!deuCerto) {
      setErro("Não foi possível salvar. Tente de novo.");
      setSalvando(false);
    }
  }

  // Resumo dos horários do preparo (só com data válida e hora)
  const resumoHorarios =
    modo === "agendar" && precisaPreparo && hora && !validarData(dataAgendada)
      ? textoDosHorarios(montarPreparo(), paraDataISO(dataAgendada), hora)
      : "";

  return (
    <TelaAdicionar
      titulo="Novo exame"
      aoVoltar={aoVoltar}
      rodape={
        <button className="add-salvar" onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : modo === "registrar" ? "Salvar no histórico" : "Salvar na agenda"}
        </button>
      }
    >
      <EscolherPet pets={pets} petId={petId} aoEscolher={aoEscolherPet} />

      <Alternador
        rotulo="Registrar ou agendar o exame"
        opcoes={[
          ["registrar", "Registrar exame"],
          ["agendar", "Agendar exame"],
        ]}
        valor={modo}
        aoMudar={(valor) => {
          setErro("");
          setModo(valor);
        }}
      />

      <div className="add-campo">
        <span className="add-rotulo">
          Qual exame? <span className="obrigatorio">*</span>
        </span>
        <Escolhas opcoes={TIPOS_EXAME} valor={tipoExame} aoEscolher={setTipoExame} />
      </div>

      {tipoExame === "Outro" && (
        <label className="add-campo">
          <span className="add-rotulo">
            Nome do exame <span className="obrigatorio">*</span>
          </span>
          <input
            type="text"
            className="add-input"
            maxLength={100}
            value={nomeOutro}
            onChange={(evento) => setNomeOutro(evento.target.value)}
          />
        </label>
      )}

      <div className="add-campo">
        <span className="add-rotulo">
          Data do exame <span className="obrigatorio">*</span>
        </span>
        {modo === "registrar" ? (
          <CampoData valor={dataFeito} aoMudar={setDataFeito} />
        ) : (
          <CampoData valor={dataAgendada} aoMudar={setDataAgendada} permitirFuturo />
        )}
      </div>

      {modo === "agendar" && (
        <label className="add-campo">
          <span className="add-rotulo">Hora</span>
          <input
            type="time"
            className="add-input add-input-hora"
            value={hora}
            onChange={(evento) => setHora(evento.target.value)}
          />
        </label>
      )}

      <label className="add-campo">
        <span className="add-rotulo">Local</span>
        <input
          type="text"
          className="add-input"
          maxLength={150}
          placeholder="Ex.: Clínica Patas"
          value={local}
          onChange={(evento) => setLocal(evento.target.value)}
        />
      </label>

      {/* Resultado: só em Registrar (o exame já foi feito) */}
      {modo === "registrar" && (
        <label className="add-campo">
          <span className="add-rotulo">Resultado</span>
          <textarea
            className="add-input add-textarea"
            maxLength={500}
            placeholder="Ex.: tudo normal; plaquetas um pouco baixas"
            value={resultado}
            onChange={(evento) => setResultado(evento.target.value)}
          ></textarea>
        </label>
      )}

      {/* Preparo: só em Agendar, para qualquer exame */}
      {modo === "agendar" && (
        <div className="add-campo">
          <span className="add-rotulo">Precisa de preparo?</span>
          <SimNao valor={precisaPreparo} aoEscolher={setPrecisaPreparo} />

          {precisaPreparo && (
            <div className="login-form add-preparo">
              <label className="med-check">
                <input
                  type="checkbox"
                  checked={jejum}
                  onChange={(evento) => setJejum(evento.target.checked)}
                />
                Jejum
              </label>
              {jejum && (
                <div className="med-linha add-preparo-detalhe">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="med-numero"
                    aria-label="Horas de jejum"
                    maxLength={2}
                    value={jejumHoras}
                    onChange={(evento) => setJejumHoras(evento.target.value.replace(/\D/g, ""))}
                  />
                  <span className="med-texto">horas antes</span>
                </div>
              )}

              <label className="med-check">
                <input
                  type="checkbox"
                  checked={darMedicamento}
                  onChange={(evento) => setDarMedicamento(evento.target.checked)}
                />
                Dar medicamento antes
              </label>
              {darMedicamento && (
                <div className="add-preparo-detalhe">
                  <input
                    type="text"
                    className="add-input"
                    aria-label="Qual medicamento"
                    placeholder="Ex.: Luftal"
                    maxLength={60}
                    value={medNome}
                    onChange={(evento) => setMedNome(evento.target.value)}
                  />
                  {/* O app acha o horário no texto: "1 hora antes", "30 minutos antes" */}
                  <input
                    type="text"
                    className="add-input"
                    aria-label="Quanto e quando"
                    placeholder="Ex.: 10 gotas, 1 hora antes"
                    maxLength={100}
                    value={medInstrucao}
                    onChange={(evento) => setMedInstrucao(evento.target.value)}
                  />
                </div>
              )}

              <label className="med-check">
                <input
                  type="checkbox"
                  checked={outroPreparo}
                  onChange={(evento) => setOutroPreparo(evento.target.checked)}
                />
                Outro preparo
              </label>
              {outroPreparo && (
                <div className="add-preparo-detalhe">
                  <textarea
                    className="add-input add-textarea"
                    aria-label="Outro preparo"
                    maxLength={300}
                    value={outroTexto}
                    onChange={(evento) => setOutroTexto(evento.target.value)}
                  ></textarea>
                </div>
              )}

              {resumoHorarios && <p className="med-resumo">{resumoHorarios}</p>}
            </div>
          )}
        </div>
      )}

      {erro && <span className="aviso-cpf">{erro}</span>}
    </TelaAdicionar>
  );
}
