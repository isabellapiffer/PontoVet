import { useState } from "react";
import CampoData from "./CampoData.jsx";
import TelaAdicionar from "./TelaAdicionar.jsx";
import { supabase } from "../supabaseClient.js";
import { paraDataISO, deDataISO } from "../formatadores.js";
import { erroDataAgendada } from "../lembretes.js";
import "./adicionarnaagenda.css";

// Lápis da gaveta de um agendamento: muda data, hora, local e observação
// (e o "O que gostaria de agendar?" do tipo Outros). Pet e tipo não mudam:
// para isso a pessoa apaga e cria de novo.
// compromisso: a linha da tabela compromissos; tutorId: id do usuário;
// aoFechar(); aoSalvar(): recarrega a Agenda depois de salvar
export default function EditarCompromisso({ compromisso, tutorId, aoFechar, aoSalvar }) {
  const [titulo, setTitulo] = useState(compromisso.titulo || "");
  const [data, setData] = useState(deDataISO(compromisso.data));
  const [hora, setHora] = useState(compromisso.hora?.slice(0, 5) || "");
  const [local, setLocal] = useState(compromisso.local || "");
  const [observacao, setObservacao] = useState(compromisso.observacao || "");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const ehOutro = compromisso.tipo === "outro";
  const ehVacina = compromisso.tipo === "vacina";

  async function salvar() {
    if (salvando) return;
    setErro("");

    if (ehOutro && !titulo.trim()) {
      setErro("Preencha o que gostaria de agendar.");
      return;
    }
    // Agendamento: só de hoje para frente
    const erroData = erroDataAgendada(data);
    if (erroData) {
      setErro(erroData);
      return;
    }

    setSalvando(true);
    const { data: alterados, error } = await supabase
      .from("compromissos")
      .update({
        ...(ehOutro ? { titulo: titulo.trim() } : {}),
        data: paraDataISO(data),
        hora: hora || null,
        local: local.trim() || null,
        observacao: observacao.trim() || null,
      })
      .eq("id", compromisso.id)
      .eq("tutor_id", tutorId)
      .select("id");

    // Sem erro mas sem linha alterada = o banco bloqueou (regra de segurança)
    if (error || !alterados?.length) {
      setErro("Não foi possível salvar. Tente de novo.");
      setSalvando(false);
      return;
    }

    await aoSalvar();
  }

  async function apagar() {
    if (salvando) return;
    if (!window.confirm("Excluir este item da agenda?")) return;

    setErro("");
    setSalvando(true);
    const { data: apagados, error } = await supabase
      .from("compromissos")
      .delete()
      .eq("id", compromisso.id)
      .eq("tutor_id", tutorId)
      .select("id");

    // Sem erro mas sem linha apagada = o banco bloqueou (regra de segurança)
    if (error || !apagados?.length) {
      setErro("Não foi possível excluir. Tente de novo.");
      setSalvando(false);
      return;
    }

    await aoSalvar();
  }

  return (
    <TelaAdicionar
      titulo="Editar agendamento"
      aoVoltar={aoFechar}
      rodape={
        <>
          <button className="add-salvar" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
          <button className="add-apagar" onClick={apagar} disabled={salvando}>
            Apagar agendamento
          </button>
        </>
      }
    >
      {ehOutro && (
        <label className="add-campo">
          <span className="add-rotulo">
            O que gostaria de agendar? <span className="obrigatorio">*</span>
          </span>
          <input
            type="text"
            className="add-input"
            maxLength={100}
            placeholder="Ex.: banho e tosa"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
          />
        </label>
      )}

      <div className="add-campo">
        <span className="add-rotulo">
          {ehVacina ? "Data agendada" : "Data"} <span className="obrigatorio">*</span>
        </span>
        <CampoData valor={data} aoMudar={setData} permitirFuturo />
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

      <label className="add-campo">
        <span className="add-rotulo">{ehOutro ? "Local" : "Com quem ou onde"}</span>
        <input
          type="text"
          className="add-input"
          maxLength={150}
          placeholder="Ex.: Dra. Ana, Clínica Patas"
          value={local}
          onChange={(evento) => setLocal(evento.target.value)}
        />
      </label>

      {!ehVacina && (
        <label className="add-campo">
          <span className="add-rotulo">Observação</span>
          <textarea
            className="add-input add-textarea"
            maxLength={500}
            placeholder="Ex.: levar os exames anteriores"
            value={observacao}
            onChange={(evento) => setObservacao(evento.target.value)}
          ></textarea>
        </label>
      )}

      {erro && <span className="aviso-cpf">{erro}</span>}
    </TelaAdicionar>
  );
}
