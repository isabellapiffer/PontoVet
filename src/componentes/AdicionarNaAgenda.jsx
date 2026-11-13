import { useState } from "react";
import CampoData from "./CampoData.jsx";
import RegistrarVacinas from "./RegistrarVacinas.jsx";
import TelaAdicionar, { EscolherPet, Alternador, Escolhas } from "./TelaAdicionar.jsx";
import NovoRemedio from "./NovoRemedio.jsx";
import NovoExame from "./NovoExame.jsx";
import { supabase } from "../supabaseClient.js";
import { validarData, paraDataISO, deDataISO } from "../formatadores.js";
import { VACINAS_POR_ESPECIE, VACINAS_OUTRAS_ESPECIES, nomeDaVacina } from "../vacinas.js";
// Estilos dos campos reaproveitados do formulário de vacina do pet
import "./historicoclinico.css";
import "./medicacoes.css";
import "./prevencoes.css";
import "../paginas/login.css";
import "./adicionarnaagenda.css";

// "+" da Agenda (protótipos de 04/11 e 05/11/2026):
// 1) gaveta "O que você quer adicionar?" com Vacina, Remédio, Consulta, Exame e Outros
// 2) o formulário do tipo escolhido, numa tela por cima da Agenda
// O que é AGENDADO vai para a tabela compromissos e aparece na Agenda.
// O que já ACONTECEU (vacina aplicada, remédio, exame feito) vai para o
// histórico do pet; a Agenda mostra o aviso "Salvo no histórico do ...".
// Remédio e Exame têm o formulário em arquivos próprios (NovoRemedio, NovoExame).

const TIPOS = [
  { id: "vacina", nome: "Vacina", icone: "fa-syringe" },
  { id: "remedio", nome: "Remédio", icone: "fa-pills" },
  { id: "consulta", nome: "Consulta", icone: "fa-stethoscope" },
  { id: "exame", nome: "Exame", icone: "fa-vial" },
  { id: "outro", nome: "Outros", icone: "fa-clipboard-list" },
];

const TITULOS_FORMULARIO = {
  vacina: "Nova vacina",
  consulta: "Nova consulta",
  outro: "Outros",
};

// pets: os pets do tutor; tutorId: id do usuário; diaInicial: "2026-11-04";
// petInicial: id do pet do filtro (ou null); aoFechar();
// aoSalvar(): depois de salvar na agenda (recarrega e fecha);
// aoSalvarNoHistorico(pet): depois de salvar no histórico (recarrega, fecha e mostra o aviso)
export default function AdicionarNaAgenda({
  pets,
  tutorId,
  diaInicial,
  petInicial,
  aoFechar,
  aoSalvar,
  aoSalvarNoHistorico,
}) {
  // null = gaveta de escolher o tipo; senão o id do tipo escolhido
  const [tipo, setTipo] = useState(null);
  // Com um pet só (ou um pet no filtro), ele já vem escolhido
  const [petId, setPetId] = useState(petInicial || (pets.length === 1 ? pets[0].id : null));
  // Vacina: "registrar" (já aplicada) ou "agendar" (vai ser aplicada)
  const [modoVacina, setModoVacina] = useState("agendar");
  const [vacina, setVacina] = useState("");
  const [oQueE, setOQueE] = useState("");
  const [data, setData] = useState(deDataISO(diaInicial));
  const [hora, setHora] = useState("");
  const [local, setLocal] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const pet = pets.find((p) => p.id === petId) || null;
  const opcoesVacina = pet ? VACINAS_POR_ESPECIE[pet.especie] || VACINAS_OUTRAS_ESPECIES : [];

  function escolherTipo(id) {
    setErro("");
    setTipo(id);
  }

  // Grava um compromisso (consulta, exame agendado, vacina agendada...).
  // dados: { tipo, titulo, data, hora, local, observacao, preparo }.
  // Devolve true se deu certo
  async function salvarNaAgenda(dados) {
    const { error } = await supabase.from("compromissos").insert({
      tutor_id: tutorId,
      pet_id: petId,
      ...dados,
    });

    if (error) {
      console.error(error);
      return false;
    }

    await aoSalvar();
    return true;
  }

  // Acrescenta coisas no histórico do pet (vacinas, medicacoes, exames...).
  // colunas: as listas que vão mudar, ex.: ["exames"].
  // montar(atual): recebe essas listas como estão AGORA no banco e devolve o que gravar
  // (ou um texto de aviso, se não der para gravar).
  // Busca a lista atual antes de gravar, para não apagar o que mudou em outro aparelho.
  // Devolve true se deu certo, false se deu erro, ou o texto de aviso do montar
  async function salvarNoPet(colunas, montar) {
    const { data: atual, error: erroBusca } = await supabase
      .from("pets")
      .select(colunas.join(", "))
      .eq("id", petId)
      .eq("tutor_id", tutorId)
      .maybeSingle();

    if (erroBusca || !atual) {
      if (erroBusca) console.error(erroBusca);
      return false;
    }

    // montar pode devolver um texto em vez do objeto: é um aviso (ex.: limite de
    // medicações). Não grava nada e devolve o aviso, para a tela mostrar
    const novo = montar(atual);
    if (typeof novo === "string") return novo;

    const { data: alterados, error } = await supabase
      .from("pets")
      .update(novo)
      .eq("id", petId)
      .eq("tutor_id", tutorId)
      .select("id");

    // Sem erro mas sem linha alterada = o banco bloqueou (regra de segurança)
    if (error || !alterados?.length) {
      if (error) console.error(error);
      return false;
    }

    await aoSalvarNoHistorico(pet);
    return true;
  }

  // Salva consulta, outros ou vacina agendada na tabela compromissos
  async function salvarCompromisso() {
    if (salvando) return;
    setErro("");

    if (!petId) {
      setErro("Escolha o pet.");
      return;
    }
    if (tipo === "vacina" && !vacina) {
      setErro("Escolha a vacina.");
      return;
    }
    if (tipo === "outro" && !oQueE.trim()) {
      setErro("Preencha o que gostaria de agendar.");
      return;
    }
    const erroData = validarData(data);
    if (erroData) {
      setErro(erroData);
      return;
    }

    let titulo = "Consulta";
    if (tipo === "vacina") titulo = `Vacina ${nomeDaVacina(vacina)}`;
    if (tipo === "outro") titulo = oQueE.trim();

    setSalvando(true);
    const deuCerto = await salvarNaAgenda({
      tipo,
      titulo,
      data: paraDataISO(data),
      hora: hora || null,
      local: local.trim() || null,
      observacao: observacao.trim() || null,
    });

    if (!deuCerto) {
      setErro("Não foi possível salvar. Tente de novo.");
      setSalvando(false);
    }
  }

  // Vacina já aplicada: acrescenta na lista de vacinas do pet (como no perfil do pet)
  async function salvarVacinaAplicada(novas) {
    if (salvando) return;
    setErro("");
    setSalvando(true);

    const deuCerto = await salvarNoPet(["vacinas"], (atual) => ({
      vacinas: [...(atual.vacinas || []), ...novas],
    }));

    if (!deuCerto) {
      setErro("Não foi possível salvar. Tente de novo.");
      setSalvando(false);
    }
  }

  // ---------- 1) Gaveta: o que você quer adicionar? ----------
  if (!tipo) {
    return (
      <div className="agenda-gaveta-fundo" onClick={aoFechar}>
        <section
          className="agenda-gaveta"
          role="dialog"
          aria-label="Adicionar na agenda"
          onClick={(evento) => evento.stopPropagation()}
        >
          <span className="agenda-gaveta-alca"></span>
          <div className="agenda-gaveta-topo">
            <h2 className="agenda-gaveta-titulo">O que você quer adicionar?</h2>
            <button className="agenda-gaveta-fechar" aria-label="Fechar" onClick={aoFechar}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="add-tipos">
            {TIPOS.map((item) => (
              <button key={item.id} className="add-tipo" onClick={() => escolherTipo(item.id)}>
                <span className="add-tipo-icone">
                  <i className={`fa-solid ${item.icone}`}></i>
                </span>
                <span className="add-tipo-nome">{item.nome}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ---------- 2) Formulário do tipo escolhido ----------
  // Remédio e Exame: formulários próprios. O pet escolhido continua aqui, para
  // não se perder ao voltar e escolher outro tipo
  const propsFormulario = {
    pets,
    petId,
    aoEscolherPet: setPetId,
    diaInicial,
    aoVoltar: () => setTipo(null),
    salvarNoPet,
    salvarNaAgenda,
  };
  if (tipo === "remedio") return <NovoRemedio {...propsFormulario} />;
  if (tipo === "exame") return <NovoExame {...propsFormulario} />;

  // Vacina, Consulta e Outros
  const mostrarCamposCompromisso =
    tipo === "consulta" || tipo === "outro" || (tipo === "vacina" && modoVacina === "agendar");

  return (
    <TelaAdicionar
      titulo={TITULOS_FORMULARIO[tipo]}
      aoVoltar={() => setTipo(null)}
      // O "Registrar aplicação" usa o botão do próprio formulário
      rodape={
        mostrarCamposCompromisso && (
          <button className="add-salvar" onClick={salvarCompromisso} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar na agenda"}
          </button>
        )
      }
    >
      <EscolherPet
        pets={pets}
        petId={petId}
        aoEscolher={(id) => {
          setPetId(id);
          setVacina(""); // as vacinas mudam conforme a espécie
        }}
      />

      {/* Vacina: registrar (já aplicada) ou agendar */}
      {tipo === "vacina" && (
        <Alternador
          rotulo="Registrar ou agendar a aplicação"
          opcoes={[
            ["registrar", "Registrar aplicação"],
            ["agendar", "Agendar aplicação"],
          ]}
          valor={modoVacina}
          aoMudar={setModoVacina}
        />
      )}

      {/* Registrar aplicação: o mesmo formulário do perfil do pet */}
      {tipo === "vacina" && modoVacina === "registrar" && (
        pet ? (
          <RegistrarVacinas
            especie={pet.especie}
            aoAdicionar={salvarVacinaAplicada}
            aoCancelar={() => setTipo(null)}
          />
        ) : (
          <p className="add-dica">Escolha o pet para ver as vacinas.</p>
        )
      )}

      {/* Agendar aplicação: escolhe UMA vacina */}
      {tipo === "vacina" && modoVacina === "agendar" && (
        <div className="add-campo">
          <span className="add-rotulo">
            Qual vacina? <span className="obrigatorio">*</span>
          </span>
          {pet ? (
            <Escolhas opcoes={opcoesVacina} valor={vacina} aoEscolher={setVacina} />
          ) : (
            <p className="add-dica">Escolha o pet para ver as vacinas.</p>
          )}
        </div>
      )}

      {tipo === "outro" && (
        <label className="add-campo">
          <span className="add-rotulo">
            O que gostaria de agendar? <span className="obrigatorio">*</span>
          </span>
          <input
            type="text"
            className="add-input"
            maxLength={100}
            placeholder="Ex.: banho e tosa"
            value={oQueE}
            onChange={(evento) => setOQueE(evento.target.value)}
          />
        </label>
      )}

      {mostrarCamposCompromisso && (
        <>
          {/* Campo de data com o botão "Data atual" (CampoData); a caixa tem o
              mesmo estilo da "Data de nascimento" do cadastro do pet */}
          <div className="add-campo">
            <span className="add-rotulo">
              {tipo === "vacina" ? "Data agendada" : "Data"} <span className="obrigatorio">*</span>
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
            {/* Outros: "Local"; Consulta e Vacina continuam "Com quem ou onde" */}
            <span className="add-rotulo">{tipo === "outro" ? "Local" : "Com quem ou onde"}</span>
            <input
              type="text"
              className="add-input"
              maxLength={150}
              placeholder="Ex.: Dra. Ana, Clínica Patas"
              value={local}
              onChange={(evento) => setLocal(evento.target.value)}
            />
          </label>

          {tipo !== "vacina" && (
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
        </>
      )}

      {erro && <span className="aviso-cpf">{erro}</span>}
    </TelaAdicionar>
  );
}
