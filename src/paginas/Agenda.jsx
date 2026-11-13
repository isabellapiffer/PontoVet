import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoCalendar, IoCalendarOutline } from "react-icons/io5";
import MenuInferior from "../componentes/MenuInferior.jsx";
import { supabase } from "../supabaseClient.js";
import { temCadastro, linkCompletarCadastro } from "../perfil.js";
import { imagemPadraoPorEspecie } from "../dadosPets.js";
import {
  hojeISO,
  lembretesDoPet,
  marcarMedicacaoComoDada,
  resumoPreparo,
  horariosDoPreparo,
  proximosDaAgenda,
  nomeDoTipo,
  itensDosCompromissos,
} from "../lembretes.js";
import { nomeComConcentracao, resumoMedicacao } from "../componentes/Medicacoes.jsx";
import AdicionarNaAgenda from "../componentes/AdicionarNaAgenda.jsx";
import { deDataISO } from "../formatadores.js";
import "./agenda.css";

// Ícone e nome de cada tipo de item da lista
const ICONES = {
  vacina: "fa-syringe",
  medicacao: "fa-pills",
  vermifugo: "fa-pills",
  antiparasitario: "fa-pills",
  consulta: "fa-stethoscope",
  exame: "fa-vial",
  outro: "fa-clipboard-list",
};

// Lembretes que mostram "Próxima dose" no detalhe
const TIPOS_COM_DOSE = ["vacina", "vermifugo", "antiparasitario"];

// Agenda do tutor (protótipo de 04/11/2026, tela "Escolhida"):
// filtro por pet, faixa da semana (o ícone de calendário no canto superior
// direito abre o mês), compromissos do dia
// e a gaveta de detalhes ao tocar num item.
// Por enquanto mostra só os LEMBRETES (vacina e remédio). Os agendamentos com
// veterinário entram quando existir a tabela de agendamentos no Supabase.

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const LETRAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

// "2026-11-04" -> Date (meio-dia, para não mudar de dia por causa do fuso)
function paraData(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia, 12);
}

// Date -> "2026-11-04"
function paraISO(data) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

// Soma dias a uma data ISO: ("2026-11-04", 7) -> "2026-11-11"
function somarDias(iso, dias) {
  const data = paraData(iso);
  data.setDate(data.getDate() + dias);
  return paraISO(data);
}

// Os 7 dias (domingo a sábado) da semana de uma data
function diasDaSemana(iso) {
  const domingo = somarDias(iso, -paraData(iso).getDay());
  return Array.from({ length: 7 }, (_, i) => somarDias(domingo, i));
}

// Os quadradinhos do mês: começa com vazios (null) até o dia da semana do dia 1
function diasDoMes(iso) {
  const data = paraData(iso);
  const ano = data.getFullYear();
  const mes = data.getMonth();
  const primeiro = new Date(ano, mes, 1, 12);
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  const vazios = Array.from({ length: primeiro.getDay() }, () => null);
  const dias = Array.from({ length: totalDias }, (_, i) =>
    paraISO(new Date(ano, mes, i + 1, 12))
  );
  return [...vazios, ...dias];
}

// "Hoje, quarta, 4 de novembro" ou "Quinta, 5 de novembro"
function tituloDoDia(iso) {
  const data = paraData(iso);
  const texto = `${DIAS_SEMANA[data.getDay()]}, ${data.getDate()} de ${MESES[data.getMonth()]}`;
  if (iso === hojeISO()) return `Hoje, ${texto}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "Novembro 2026"
function tituloDoMes(iso) {
  const data = paraData(iso);
  const mes = MESES[data.getMonth()];
  return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${data.getFullYear()}`;
}

// "2026-11-04" -> "04/11/2026"
function dataBrasileira(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Horários do preparo de um exame com hora (detalhe do compromisso):
// "Jejum a partir de 01:00 · Dar Luftal às 08:00"
// (jejum que começa num dia antes do exame mostra o dia: "a partir de 22:00 de 11/11")
function textoDosHorarios(item) {
  const { preparo, data } = item.compromisso;
  const horarios = horariosDoPreparo(preparo, data, item.hora);
  const partes = [];
  if (horarios.jejum) {
    const dia = horarios.jejum.data !== data ? ` de ${dataBrasileira(horarios.jejum.data).slice(0, 5)}` : "";
    partes.push(`Jejum a partir de ${horarios.jejum.hora}${dia}`);
  }
  if (horarios.medicamento) {
    partes.push(`Dar ${preparo.medicamento.nome} às ${horarios.medicamento.hora}`);
  }
  return partes.join(" · ");
}

// Foto do pet: a dele, a padrão da espécie ou nenhuma (mostra a patinha)
function fotoDoPet(pet) {
  return pet.foto_url || imagemPadraoPorEspecie[pet.especie] || null;
}

function FotoPet({ pet, className }) {
  const foto = fotoDoPet(pet);
  if (foto) return <img src={foto} alt="" className={className} />;
  return (
    <span className={`${className} agenda-foto-vazia`}>
      <i className="fa-solid fa-paw"></i>
    </span>
  );
}

export default function Agenda() {
  const navigate = useNavigate();

  const [usuarioId, setUsuarioId] = useState(null);
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroPets, setErroPets] = useState(false);
  const [erroCompromissos, setErroCompromissos] = useState(false);

  // Pet escolhido no filtro (null = Todos)
  const [petFiltro, setPetFiltro] = useState(null);
  // Dia escolhido (começa hoje)
  const [diaEscolhido, setDiaEscolhido] = useState(hojeISO());
  // true = calendário do mês aberto; false = só a faixa da semana
  const [mesAberto, setMesAberto] = useState(false);
  // Lembrete aberto na gaveta de detalhes (null = gaveta fechada)
  const [itemAberto, setItemAberto] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroGaveta, setErroGaveta] = useState("");
  // Consultas, exames e vacinas agendadas (tabela compromissos)
  const [compromissos, setCompromissos] = useState([]);
  // true = o "+" foi tocado (gaveta de escolher o tipo / formulário aberto)
  const [adicionando, setAdicionando] = useState(false);
  // Aviso "Salvo no histórico do Thor · Ver" (o pet salvo, ou null = sem aviso)
  const [avisoSalvo, setAvisoSalvo] = useState(null);

  // O aviso some sozinho depois de alguns segundos
  useEffect(() => {
    if (!avisoSalvo) return;
    const relogio = setTimeout(() => setAvisoSalvo(null), 6000);
    return () => clearTimeout(relogio); // aviso novo antes de acabar: recomeça a contar
  }, [avisoSalvo]);

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { state: { voltarPara: "/agenda" } });
        return;
      }

      const [cadastroOk] = await Promise.all([
        temCadastro(user.id),
        carregarPets(user.id),
        carregarCompromissos(user.id),
      ]);

      if (!cadastroOk) {
        navigate(linkCompletarCadastro("/agenda"));
        return;
      }

      setUsuarioId(user.id);
      setCarregando(false);
    }

    iniciar();
  }, []);

  async function carregarPets(tutorId) {
    const { data, error } = await supabase
      .from("pets")
      // vermifugacoes e antiparasitarios: lembretes da próxima dose;
      // doencas_em_tratamento: os botões de doença do "+ Remédio"
      .select(
        "id, nome, especie, foto_url, medicacoes, vacinas, vermifugacoes, antiparasitarios, doencas_em_tratamento"
      )
      .eq("tutor_id", tutorId)
      .order("criado_em", { ascending: true });

    setErroPets(!!error);
    if (error) return;

    setPets(data || []);
  }

  async function carregarCompromissos(tutorId) {
    const { data, error } = await supabase
      .from("compromissos")
      .select("*")
      .eq("tutor_id", tutorId);

    setErroCompromissos(!!error);
    if (error) return;

    setCompromissos(data || []);
  }

  // Depois de salvar algo pelo "+": recarrega tudo e fecha
  async function depoisDeAdicionar() {
    await Promise.all([carregarPets(usuarioId), carregarCompromissos(usuarioId)]);
    setAdicionando(false);
  }

  // Depois de salvar no histórico do pet (vacina aplicada, remédio, exame feito):
  // fecha, continua na Agenda e mostra o aviso com o "Ver"
  async function depoisDeSalvarNoHistorico(pet) {
    await depoisDeAdicionar();
    setAvisoSalvo(pet);
  }

  // Lembretes (vacina e remédio dos pets) + compromissos, só dos pets do filtro
  const petsVisiveis = petFiltro ? pets.filter((p) => p.id === petFiltro) : pets;
  const lembretes = petsVisiveis.flatMap(lembretesDoPet);
  const itensCompromissos = itensDosCompromissos(compromissos, petsVisiveis);
  const todos = [...lembretes, ...itensCompromissos];

  // Dias que têm algum item (para a bolinha embaixo do número)
  const diasComItem = new Set(todos.map((item) => item.data));
  // Itens do dia: os com hora primeiro, em ordem de hora
  const itensDoDia = todos
    .filter((item) => item.data === diaEscolhido)
    .sort((a, b) => (a.hora || "99").localeCompare(b.hora || "99"));
  const hoje = hojeISO();
  const proximos = proximosDaAgenda(todos, hoje, diaEscolhido);

  async function excluirCompromisso() {
    if (salvando) return;
    if (!window.confirm("Excluir este item da agenda?")) return;

    setSalvando(true);
    setErroGaveta("");

    const { data: apagados, error } = await supabase
      .from("compromissos")
      .delete()
      .eq("id", itemAberto.compromisso.id)
      .eq("tutor_id", usuarioId)
      .select("id");

    setSalvando(false);
    // Sem erro mas sem linha apagada = o banco bloqueou (regra de segurança)
    if (error || !apagados?.length) {
      setErroGaveta("Não foi possível excluir. Tente de novo.");
      return;
    }

    await carregarCompromissos(usuarioId);
    setItemAberto(null);
  }

  // Setas do topo: andam uma semana (faixa) ou um mês (calendário aberto)
  function andar(direcao) {
    if (mesAberto) {
      const data = paraData(diaEscolhido);
      const novo = new Date(data.getFullYear(), data.getMonth() + direcao, 1, 12);
      setDiaEscolhido(paraISO(novo));
    } else {
      setDiaEscolhido(somarDias(diaEscolhido, 7 * direcao));
    }
  }

  function abrirItem(item) {
    setErroGaveta("");
    setItemAberto(item);
  }

  async function marcarComoDado() {
    if (salvando) return;
    setSalvando(true);
    setErroGaveta("");

    const erro = await marcarMedicacaoComoDada(itemAberto, usuarioId);

    if (erro) {
      setErroGaveta("Não foi possível salvar. Tente de novo.");
      setSalvando(false);
      return;
    }

    await carregarPets(usuarioId);
    setSalvando(false);
    setItemAberto(null);
  }

  // Um item das listas (do dia e próximos). comData: mostra a data ("30/11")
  // à direita, com a hora embaixo, porque nos próximos cada item é de um dia.
  function itemDaLista(item, comData) {
    return (
      <button key={item.id} className="agenda-item" onClick={() => abrirItem(item)}>
        {/* Compromisso (consulta, exame, vacina agendada): ícone roxo forte;
            lembrete: ícone lilás */}
        <span className={item.compromisso ? "agenda-item-icone agenda-item-icone-forte" : "agenda-item-icone"}>
          <i className={`fa-solid ${ICONES[item.tipo] || ICONES.outro}`}></i>
        </span>
        <span className="agenda-item-textos">
          <span className="agenda-item-titulo">
            {item.titulo} · {item.pet.nome}
          </span>
          <span className="agenda-item-tipo">
            {nomeDoTipo(item)}
            {item.compromisso?.local && ` · ${item.compromisso.local}`}
            {!item.compromisso && item.data < hoje && " · atrasado"}
          </span>
          {/* Exame com preparo: "Jejum de 8 horas · Luftal: 10 gotas, 1 hora antes" */}
          {resumoPreparo(item.compromisso?.preparo) && (
            <span className="agenda-item-tipo">
              Preparo: {resumoPreparo(item.compromisso.preparo)}
            </span>
          )}
        </span>
        {comData ? (
          <span className="agenda-item-hora agenda-item-quando">
            {deDataISO(item.data).slice(0, 5)}
            {item.hora && <small>{item.hora}</small>}
          </span>
        ) : (
          item.hora && <span className="agenda-item-hora">{item.hora}</span>
        )}
      </button>
    );
  }

  // Um dia na faixa da semana ou no calendário do mês
  function BotaoDia({ iso, comLetra }) {
    const data = paraData(iso);
    let classe = "agenda-dia";
    if (iso === diaEscolhido) classe += " agenda-dia-escolhido";
    else if (iso === hoje) classe += " agenda-dia-hoje";

    return (
      <button
        className={classe}
        aria-pressed={iso === diaEscolhido}
        aria-label={tituloDoDia(iso)}
        onClick={() => setDiaEscolhido(iso)}
      >
        {comLetra && (
          <span className="agenda-dia-letra">{LETRAS_SEMANA[data.getDay()]}</span>
        )}
        <span className="agenda-dia-numero">{data.getDate()}</span>
        <span
          className={diasComItem.has(iso) ? "agenda-bolinha agenda-bolinha-ativa" : "agenda-bolinha"}
        ></span>
      </button>
    );
  }

  return (
    <div className="agenda-pagina">
      <header className="agenda-topo">
        <h1 className="agenda-titulo">Agenda</h1>
      </header>

      {/* Filtro por pet: "Todos" + foto com o nome embaixo */}
      {pets.length > 0 && (
        <div className="agenda-filtro" role="group" aria-label="Filtrar por pet">
          <button
            className="agenda-filtro-item"
            aria-pressed={petFiltro === null}
            onClick={() => setPetFiltro(null)}
          >
            <span className={petFiltro === null ? "agenda-todos agenda-todos-ativo" : "agenda-todos"}>
              Todos
            </span>
          </button>
          {pets.map((pet) => (
            <button
              key={pet.id}
              className="agenda-filtro-item"
              aria-pressed={petFiltro === pet.id}
              onClick={() => setPetFiltro(pet.id)}
            >
              <FotoPet
                pet={pet}
                className={petFiltro === pet.id ? "agenda-filtro-foto agenda-filtro-foto-ativa" : "agenda-filtro-foto"}
              />
              <span className="agenda-filtro-nome">{pet.nome}</span>
            </button>
          ))}
        </div>
      )}

      {/* Linha logo acima da semana: mês com as setas (andam uma semana na
          faixa ou um mês no calendário aberto) e, à direita, o ícone de
          calendário que abre e fecha o mês inteiro */}
      <div className="agenda-mes">
        <div className="agenda-mes-navegar">
          <button className="agenda-seta" aria-label={mesAberto ? "Mês anterior" : "Semana anterior"} onClick={() => andar(-1)}>
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <span>{tituloDoMes(diaEscolhido)}</span>
          <button className="agenda-seta" aria-label={mesAberto ? "Próximo mês" : "Próxima semana"} onClick={() => andar(1)}>
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        {/* Aberto: o ícone fica preenchido e o botão roxo */}
        <button
          className={mesAberto ? "agenda-botao-mes agenda-botao-mes-ativo" : "agenda-botao-mes"}
          aria-label={mesAberto ? "Fechar o calendário do mês" : "Abrir o calendário do mês"}
          aria-pressed={mesAberto}
          onClick={() => setMesAberto(!mesAberto)}
        >
          {mesAberto ? <IoCalendar /> : <IoCalendarOutline />}
        </button>
      </div>

      {/* Faixa da semana ou calendário do mês */}
      <section className="agenda-calendario" aria-label={mesAberto ? "Mês" : "Semana"}>
        {mesAberto ? (
          <div className="agenda-grade">
            {LETRAS_SEMANA.map((letra, i) => (
              <span key={i} className="agenda-dia-letra agenda-grade-letra">{letra}</span>
            ))}
            {diasDoMes(diaEscolhido).map((iso, i) =>
              iso ? <BotaoDia key={iso} iso={iso} /> : <span key={`vazio-${i}`}></span>
            )}
          </div>
        ) : (
          <div className="agenda-grade">
            {diasDaSemana(diaEscolhido).map((iso) => (
              <BotaoDia key={iso} iso={iso} comLetra />
            ))}
          </div>
        )}
      </section>

      {/* Compromissos do dia escolhido */}
      <section className="agenda-dia-lista">
        <h2 className="agenda-dia-titulo">{tituloDoDia(diaEscolhido)}</h2>

        {carregando ? (
          <p className="agenda-vazio">Carregando...</p>
        ) : (erroPets || erroCompromissos) ? (
          <p className="agenda-vazio">Não foi possível carregar sua agenda.</p>
        ) : itensDoDia.length === 0 ? (
          <p className="agenda-vazio">Nada marcado para este dia.</p>
        ) : (
          itensDoDia.map((item) => itemDaLista(item, false))
        )}
      </section>

      {/* Próximos agendamentos: os 5 mais perto, de amanhã em diante (seguem o filtro de pet) */}
      {!carregando && !erroPets && !erroCompromissos && (
        <section className="agenda-dia-lista">
          <h2 className="agenda-dia-titulo">Próximos agendamentos</h2>
          {proximos.length === 0 ? (
            <p className="agenda-vazio">Nada marcado nos próximos dias.</p>
          ) : (
            proximos.map((item) => itemDaLista(item, true))
          )}
        </section>
      )}

      {/* Gaveta de detalhes */}
      {itemAberto && (
        <div className="agenda-gaveta-fundo" onClick={() => setItemAberto(null)}>
          <section
            className="agenda-gaveta"
            role="dialog"
            aria-label={itemAberto.titulo}
            // clicar dentro da gaveta não fecha (só no fundo escuro)
            onClick={(evento) => evento.stopPropagation()}
          >
            <span className="agenda-gaveta-alca"></span>
            <div className="agenda-gaveta-topo">
              <div>
                <span className="agenda-gaveta-tipo">{nomeDoTipo(itemAberto)}</span>
                <h2 className="agenda-gaveta-titulo">
                  {itemAberto.tipo === "medicacao"
                    ? nomeComConcentracao(itemAberto.medicacao)
                    : itemAberto.titulo}
                </h2>
              </div>
              <button className="agenda-gaveta-fechar" aria-label="Fechar" onClick={() => setItemAberto(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <dl className="agenda-gaveta-dados">
              <div>
                <dt>Pet</dt>
                <dd className="agenda-gaveta-pet">
                  <FotoPet pet={itemAberto.pet} className="agenda-gaveta-pet-foto" />
                  {itemAberto.pet.nome}
                </dd>
              </div>
              {itemAberto.compromisso ? (
                <div>
                  <dt>Quando</dt>
                  <dd>
                    {dataBrasileira(itemAberto.data)}
                    {itemAberto.hora && ` · ${itemAberto.hora}`}
                  </dd>
                </div>
              ) : (
                <div>
                  <dt>{TIPOS_COM_DOSE.includes(itemAberto.tipo) ? "Próxima dose" : "Próxima vez"}</dt>
                  <dd>
                    {dataBrasileira(itemAberto.data)}
                    {itemAberto.data < hoje && " (atrasado)"}
                  </dd>
                </div>
              )}
              {itemAberto.compromisso?.local && (
                <div>
                  <dt>Com quem ou onde</dt>
                  <dd>{itemAberto.compromisso.local}</dd>
                </div>
              )}
              {resumoPreparo(itemAberto.compromisso?.preparo) && (
                <div>
                  <dt>Preparo</dt>
                  <dd>
                    {resumoPreparo(itemAberto.compromisso.preparo)}
                    {/* Com a hora do exame: os horários calculados */}
                    {textoDosHorarios(itemAberto) && (
                      <span className="agenda-gaveta-preparo">{textoDosHorarios(itemAberto)}</span>
                    )}
                  </dd>
                </div>
              )}
              {itemAberto.compromisso?.observacao && (
                <div>
                  <dt>Observação</dt>
                  <dd>{itemAberto.compromisso.observacao}</dd>
                </div>
              )}
              {itemAberto.tipo === "medicacao" && resumoMedicacao(itemAberto.medicacao) && (
                <div>
                  <dt>Dose</dt>
                  <dd>{resumoMedicacao(itemAberto.medicacao)}</dd>
                </div>
              )}
            </dl>

            {erroGaveta && <p className="agenda-gaveta-erro">{erroGaveta}</p>}

            {itemAberto.compromisso ? (
              // Adicionado pelo "+": dá para excluir.
              // (Os agendados pelo app vão ter "Remarcar" e "Cancelar agendamento")
              <button
                className="agenda-gaveta-botao agenda-gaveta-botao-excluir"
                onClick={excluirCompromisso}
                disabled={salvando}
              >
                {salvando ? "Excluindo..." : "Excluir da agenda"}
              </button>
            ) : itemAberto.tipo === "medicacao" ? (
              <button className="agenda-gaveta-botao" onClick={marcarComoDado} disabled={salvando}>
                {salvando ? "Salvando..." : "Marcar como dado"}
              </button>
            ) : (
              <button
                className="agenda-gaveta-botao agenda-gaveta-botao-contorno"
                onClick={() => navigate(`/pet/${itemAberto.pet.id}`)}
              >
                Ver o perfil do pet
              </button>
            )}
          </section>
        </div>
      )}

      {/* Botão redondo "+" (só depois de carregar e com pelo menos um pet) */}
      {!carregando && pets.length > 0 && (
        <button
          className="agenda-botao-adicionar"
          aria-label="Adicionar na agenda"
          onClick={() => setAdicionando(true)}
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      )}

      {adicionando && (
        <AdicionarNaAgenda
          pets={pets}
          tutorId={usuarioId}
          diaInicial={diaEscolhido}
          petInicial={petFiltro}
          aoFechar={() => setAdicionando(false)}
          aoSalvar={depoisDeAdicionar}
          aoSalvarNoHistorico={depoisDeSalvarNoHistorico}
        />
      )}

      {/* Aviso depois de salvar no histórico: "Salvo no histórico do Thor · Ver" */}
      {avisoSalvo && (
        <div className="agenda-aviso" role="status">
          <span>Salvo no histórico do {avisoSalvo.nome}</span>
          <button className="agenda-aviso-ver" onClick={() => navigate(`/pet/${avisoSalvo.id}`)}>
            Ver
          </button>
        </div>
      )}

      <MenuInferior />
    </div>
  );
}
