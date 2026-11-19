import { useState } from "react";
import TelaAdicionar, { Escolhas } from "./TelaAdicionar.jsx";
import { UNIDADES_DOSE, soDose } from "./Medicacoes.jsx";
import CampoData from "./CampoData.jsx";
import ListaOpcoes from "./ListaOpcoes.jsx";
import { calcularProxima } from "./NovoRemedio.jsx";
import { supabase } from "../supabaseClient.js";
import { validarData, paraDataISO, deDataISO } from "../formatadores.js";
import { hojeISO, REPETIR, repetirDaProxima, trocarRegistro } from "../lembretes.js";
import "./historicoclinico.css";
import "./medicacoes.css";
import "../paginas/login.css";
import "./adicionarnaagenda.css";

// Lápis do lembrete de vermífugo ou antipulgas na Agenda: o mesmo formulário do
// "+ Medicamentos", já preenchido com o que a pessoa registrou.
// - Salvar alterações: troca o registro no histórico do pet
// - Apagar lembrete: tira só a próxima dose (o registro continua no histórico)
// historico: { coluna: "vermifugacoes" | "antiparasitarios", registro }
// petId, tutorId; aoFechar(); aoSalvar(): recarrega a Agenda
export default function EditarPrevencao({ historico, petId, tutorId, aoFechar, aoSalvar }) {
  const { coluna, registro } = historico;
  const ehVermifugo = coluna === "vermifugacoes";
  const inicial = repetirDaProxima(registro.data, registro.proxima);

  const [produto, setProduto] = useState(registro.produto || "");
  const [dose, setDose] = useState(registro.dose || "");
  const [unidade, setUnidade] = useState(registro.unidade || "");
  const [dataDada, setDataDada] = useState(deDataISO(registro.data));
  const [repetir, setRepetir] = useState(inicial.repetir);
  const [outroQuantidade, setOutroQuantidade] = useState(inicial.quantidade || "");
  const [outroTempo, setOutroTempo] = useState(inicial.tempo || "dia");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const proxima = calcularProxima(dataDada, repetir, outroQuantidade, outroTempo);

  // Busca a lista atual do pet, troca o registro e grava (como o salvarNoPet do "+").
  // Devolve true se deu certo
  async function gravar(mudancas) {
    const { data: atual, error: erroBusca } = await supabase
      .from("pets")
      .select(coluna)
      .eq("id", petId)
      .eq("tutor_id", tutorId)
      .maybeSingle();
    if (erroBusca || !atual) return false;

    const { data: alterados, error } = await supabase
      .from("pets")
      .update({ [coluna]: trocarRegistro(atual[coluna], registro, mudancas) })
      .eq("id", petId)
      .eq("tutor_id", tutorId)
      .select("id");

    // Sem erro mas sem linha alterada = o banco bloqueou (regra de segurança)
    return !error && alterados?.length > 0;
  }

  async function salvar() {
    if (salvando) return;
    setErro("");

    if (!produto.trim()) {
      setErro("Escreva o nome do produto.");
      return;
    }
    const erroData = validarData(dataDada);
    if (erroData) {
      setErro(erroData);
      return;
    }
    if (paraDataISO(dataDada) > hojeISO()) {
      setErro("A data não pode ser no futuro.");
      return;
    }

    setSalvando(true);
    const deuCerto = await gravar({
      produto: produto.trim(),
      dose,
      unidade,
      data: paraDataISO(dataDada),
      proxima: proxima || null,
    });
    if (!deuCerto) {
      setErro("Não foi possível salvar. Tente de novo.");
      setSalvando(false);
      return;
    }
    await aoSalvar();
  }

  async function apagar() {
    if (salvando) return;
    if (!window.confirm("Apagar este lembrete? O registro continua no histórico do pet.")) return;

    setErro("");
    setSalvando(true);
    if (!(await gravar({ proxima: null }))) {
      setErro("Não foi possível apagar. Tente de novo.");
      setSalvando(false);
      return;
    }
    await aoSalvar();
  }

  return (
    <TelaAdicionar
      titulo={ehVermifugo ? "Editar vermífugo" : "Editar antipulgas e carrapatos"}
      aoVoltar={aoFechar}
      rodape={
        <>
          <button className="add-salvar" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
          <button className="add-apagar" onClick={apagar} disabled={salvando}>
            Apagar lembrete
          </button>
        </>
      }
    >
      <label className="add-campo">
        <span className="add-rotulo">
          {ehVermifugo ? "Qual vermífugo?" : "Qual produto?"} <span className="obrigatorio">*</span>
        </span>
        <input
          type="text"
          className="add-input"
          maxLength={60}
          placeholder={ehVermifugo ? "Ex: Drontal" : "Ex: Bravecto"}
          value={produto}
          onChange={(evento) => setProduto(evento.target.value)}
        />
      </label>

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
          opcoes={[...REPETIR.map(([texto]) => texto), "Outro"]}
          valor={repetir}
          aoEscolher={(texto) => setRepetir(texto === repetir ? "" : texto)}
        />
        {repetir === "Outro" && (
          <div className="med-linha">
            <input
              type="text"
              inputMode="numeric"
              className="med-numero"
              aria-label="Quantidade"
              maxLength={2}
              value={outroQuantidade}
              onChange={(evento) => setOutroQuantidade(evento.target.value.replace(/\D/g, ""))}
            />
            <ListaOpcoes
              opcoes={[
                ["dia", outroQuantidade === "1" ? "dia" : "dias"],
                ["mes", outroQuantidade === "1" ? "mês" : "meses"],
              ]}
              valor={outroTempo}
              aoMudar={setOutroTempo}
            />
          </div>
        )}
        {proxima && <span className="add-destaque">Próxima dose: {deDataISO(proxima)}</span>}
      </div>

      {erro && <span className="aviso-cpf">{erro}</span>}
    </TelaAdicionar>
  );
}
