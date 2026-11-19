import { useState } from "react";
import TelaAdicionar from "./TelaAdicionar.jsx";
import RegistrarVacinas from "./RegistrarVacinas.jsx";
import { supabase } from "../supabaseClient.js";
import { deDataISO } from "../formatadores.js";
import { hojeISO } from "../lembretes.js";
import { vacinasDoTitulo } from "../vacinas.js";
import "./historicoclinico.css";
import "./medicacoes.css";
import "./prevencoes.css";
import "../paginas/login.css";
import "./adicionarnaagenda.css";

// "Registrar aplicação" de uma vacina agendada na Agenda: o formulário de vacinas
// do perfil do pet, já com as vacinas do agendamento marcadas e a data dele.
// Ao adicionar: as vacinas vão para o histórico do pet (com a próxima aplicação,
// que vira lembrete na Agenda) e o agendamento sai da agenda.
// compromisso: a linha de compromissos ("Vacina V10 + Raiva"); pet; tutorId;
// aoFechar(); aoSalvar(): recarrega a Agenda
export default function RegistrarAplicacao({ compromisso, pet, tutorId, aoFechar, aoSalvar }) {
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Agendada para o futuro: começa com hoje (vacina aplicada não pode ser no futuro)
  const hoje = hojeISO();
  const dataInicial = deDataISO(compromisso.data > hoje ? hoje : compromisso.data);

  async function salvar(novas) {
    if (salvando) return;
    setErro("");
    setSalvando(true);

    // Busca as vacinas atuais antes de gravar, para não apagar o que mudou em outro aparelho
    const { data: atual, error: erroBusca } = await supabase
      .from("pets")
      .select("vacinas")
      .eq("id", pet.id)
      .eq("tutor_id", tutorId)
      .maybeSingle();

    const { data: alterados, error } =
      erroBusca || !atual
        ? { error: true }
        : await supabase
            .from("pets")
            .update({ vacinas: [...(atual.vacinas || []), ...novas] })
            .eq("id", pet.id)
            .eq("tutor_id", tutorId)
            .select("id");

    // Sem erro mas sem linha alterada = o banco bloqueou (regra de segurança)
    if (error || !alterados?.length) {
      setErro("Não foi possível salvar. Tente de novo.");
      setSalvando(false);
      return;
    }

    // Já está no histórico: o agendamento sai da agenda
    await supabase
      .from("compromissos")
      .delete()
      .eq("id", compromisso.id)
      .eq("tutor_id", tutorId);

    await aoSalvar();
  }

  return (
    <TelaAdicionar titulo="Registrar aplicação" aoVoltar={aoFechar}>
      <RegistrarVacinas
        especie={pet.especie}
        iniciais={vacinasDoTitulo(compromisso.titulo)}
        dataInicial={dataInicial}
        aoAdicionar={salvar}
        aoCancelar={aoFechar}
      />
      {erro && <span className="aviso-cpf">{erro}</span>}
    </TelaAdicionar>
  );
}
