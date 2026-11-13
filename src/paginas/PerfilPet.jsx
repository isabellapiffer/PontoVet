import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IoChevronDown, IoChevronUp, IoPaw, IoPencil } from "react-icons/io5";
import BotaoVoltar from "../componentes/BotaoVoltar.jsx";
import FormularioPet, { textoCastrado } from "../componentes/FormularioPet.jsx";
import {
  nomeComConcentracao,
  resumoMedicacao,
  fimDaMedicacao,
} from "../componentes/Medicacoes.jsx";
import { resumoPrevencao } from "../componentes/Prevencoes.jsx";
import { textoPeso } from "../peso.js";
import { resumoTeste, textoDoenca } from "../componentes/HistoricoClinico.jsx";
import Lembretes from "../componentes/Lembretes.jsx";
import Carteirinha from "../componentes/Carteirinha.jsx";
import {
  lembretesDeHoje,
  lembretesDoPet,
  hojeISO,
  resumoPreparo,
  avisosDoPreparoDeHoje,
} from "../lembretes.js";
import { supabase } from "../supabaseClient.js";
import { imagemPadraoPorEspecie } from "../dadosPets.js";
import { idadeEmAnosEMeses, textoIdade, deDataISO } from "../formatadores.js";
import MenuInferior from "../componentes/MenuInferior.jsx";
import "./perfilpet.css";

// Alergias e cirurgias: "Frango, Dipirona" / "Não tem" / "Não preenchido"
function textoSimNao(tem, lista) {
  if (tem === false) return "Não tem";
  if (tem === true && lista?.length) return lista.join(", ");
  return "Não preenchido";
}

const MESES_CURTOS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// Medicações em uso, para o destaque "Em tratamento": as das doenças em tratamento
// e os outros medicamentos que ainda não terminaram
function medicacoesEmUso(pet) {
  const hoje = hojeISO();
  const daDoenca = (pet.medicacoes || []).filter((med) => med?.nome);
  const outros = (pet.outros_medicamentos || []).filter((med) => {
    if (!med?.nome) return false;
    const fim = fimDaMedicacao(med);
    return !fim || fim >= hoje; // sem fim conhecido: continua aparecendo
  });
  return [...daDoenca, ...outros];
}

// "Dermatite · 1 vez ao dia · termina em 12/11/2026"
function detalheDaMedicacao(med) {
  const fim = fimDaMedicacao(med);
  return [med.doenca, resumoMedicacao(med), fim && `termina em ${deDataISO(fim)}`]
    .filter(Boolean)
    .join(" · ");
}

// Próximos do pet, para o destaque "Próximos": compromissos de hoje em diante e
// os lembretes que ainda vão chegar (vacina, vermífugo...), do mais perto ao mais longe
function proximosDoPet(pet, compromissos) {
  const hoje = hojeISO();
  const agendados = compromissos.map((c) => ({
    id: `compromisso-${c.id}`,
    data: c.data,
    titulo: c.hora ? `${c.titulo} · ${c.hora.slice(0, 5)}` : c.titulo,
    detalhe: resumoPreparo(c.preparo) || c.local || "",
  }));
  const lembretes = lembretesDoPet(pet)
    .filter((lembrete) => lembrete.data >= hoje)
    .map((lembrete) => ({
      id: lembrete.id,
      data: lembrete.data,
      titulo: lembrete.titulo,
      detalhe: lembrete.tipo === "medicacao" ? "Próxima vez" : "Próxima dose",
    }));
  return [...agendados, ...lembretes].sort((a, b) => a.data.localeCompare(b.data));
}

export default function PerfilPet() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [usuarioId, setUsuarioId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // Qual lápis foi clicado: null (só vendo), "dados" ou "historico".
  // Vindo do "+ Remédio" da Agenda, já abre editando o histórico
  const [editando, setEditando] = useState(
    location.state?.editar === "historico" ? "historico" : null
  );
  // Histórico clínico no perfil: começa escondido; abre ao clicar no título
  const [historicoAberto, setHistoricoAberto] = useState(false);
  // Compromissos do pet de hoje em diante (consultas, exames, vacinas agendadas...)
  const [compromissos, setCompromissos] = useState([]);

  // Se der erro, o destaque "Próximos" só fica sem os compromissos
  async function carregarCompromissos(tutorId) {
    const { data, error } = await supabase
      .from("compromissos")
      .select("*")
      .eq("pet_id", id)
      .eq("tutor_id", tutorId)
      .gte("data", hojeISO());
    if (error) console.error(error);
    else setCompromissos(data || []);
  }

  async function carregarPet(tutorId) {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("id", id)
      .eq("tutor_id", tutorId)
      .maybeSingle();

    if (error) {
      console.error(error);
      setErro("Não foi possível carregar este pet. Tente de novo.");
    } else if (!data) {
      setErro("Pet não encontrado.");
    } else {
      setPet(data);
    }
  }

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { state: { voltarPara: `/pet/${id}` } });
        return;
      }

      setUsuarioId(user.id);
      await Promise.all([carregarPet(user.id), carregarCompromissos(user.id)]);
      setCarregando(false);
    }

    iniciar();
  }, [id]);

  // Ao abrir ou fechar o formulário, volta para o topo da tela
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [editando]);

  function voltar() {
    // Alterando os dados: a seta só fecha o formulário, sem salvar
    if (editando) {
      setEditando(null);
      return;
    }

    // Volta para a tela de onde a pessoa veio (inicial ou Meus Animais).
    // Se ela abriu o link direto, não tem "tela anterior": vai para a inicial.
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  if (carregando) {
    return null;
  }

  const foto = pet && (pet.foto_url || imagemPadraoPorEspecie[pet.especie]);

  // Mostra a idade de hoje, e não a data de nascimento (ex.: "1 ano e 5 meses")
  let idade = "Não informada";
  if (pet?.data_nascimento) {
    const texto = textoIdade(idadeEmAnosEMeses(pet.data_nascimento));
    idade = texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  // Os dois destaques do topo do histórico
  const emUso = pet ? medicacoesEmUso(pet) : [];
  const proximos = pet ? proximosDoPet(pet, compromissos) : [];

  return (
    <div className="perfil-pet">
      <header className="topo-com-voltar">
        <BotaoVoltar aoClicar={voltar} />
        <h1 className="perfil-pet-titulo">
          {editando ? "Alterar dados" : pet ? pet.nome : "Pet"}
        </h1>
      </header>

      {erro && <p className="perfil-pet-erro">{erro}</p>}

      {pet && editando && (
        <FormularioPet
          usuarioId={usuarioId}
          petInicial={pet}
          gavetaInicial={editando}
          aoSalvar={async () => {
            await carregarPet(usuarioId);
            setEditando(null);
          }}
        />
      )}

      {pet && !editando && (
        <>
          <section className="perfil-pet-card">
            <button
              className="perfil-pet-editar"
              aria-label="Alterar dados do pet"
              onClick={() => setEditando("dados")}
            >
              <IoPencil />
            </button>

            {foto ? (
              <img src={foto} alt={pet.nome} className="perfil-pet-foto" />
            ) : (
              <div className="perfil-pet-foto perfil-pet-foto-vazia">
                <IoPaw />
              </div>
            )}

            <div className="perfil-pet-dados">
              <h2 className="perfil-pet-nome">{pet.nome}</h2>
              <p className="perfil-pet-especie">
                {pet.especie}
                {pet.raca ? ` · ${pet.raca}` : ""}
              </p>

              <dl className="perfil-pet-lista">
                <div>
                  <dt>Sexo</dt>
                  <dd>{pet.sexo || "Não informado"}</dd>
                </div>
                <div>
                  <dt>Castrado</dt>
                  <dd>{textoCastrado(pet.castrado)}</dd>
                </div>
                <div>
                  <dt>Idade</dt>
                  <dd>{idade}</dd>
                </div>
                <div>
                  <dt>Coloração</dt>
                  <dd>{pet.coloracao || "Não informada"}</dd>
                </div>
                <div>
                  <dt>Peso</dt>
                  <dd>{textoPeso(pet.pesos)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <Lembretes
            // Os avisos do preparo de exame (jejum, remédio antes) entram junto
            lembretes={[...lembretesDeHoje([pet]), ...avisosDoPreparoDeHoje(compromissos, [pet])]}
            tutorId={usuarioId}
            aoAtualizar={() => carregarPet(usuarioId)}
          />

          <section className="perfil-pet-secao">
            <div className="perfil-pet-secao-topo">
              <button
                type="button"
                className="perfil-pet-secao-abrir"
                aria-expanded={historicoAberto}
                onClick={() => setHistoricoAberto(!historicoAberto)}
              >
                <h2 className="perfil-pet-secao-titulo">Histórico clínico</h2>
                {historicoAberto ? <IoChevronUp /> : <IoChevronDown />}
              </button>
              <button
                className="perfil-pet-editar perfil-pet-editar-secao"
                aria-label="Alterar histórico clínico"
                onClick={() => setEditando("historico")}
              >
                <IoPencil />
              </button>
            </div>

            {/* Destaque 1: remédios em uso (some se não tiver nenhum) */}
            {emUso.length > 0 && (
              <div className="perfil-pet-destaque perfil-pet-destaque-cheio" aria-label="Em tratamento">
                <h3 className="perfil-pet-destaque-titulo">
                  <span className="perfil-pet-destaque-icone">
                    <i className="fa-solid fa-pills"></i>
                  </span>
                  Em tratamento
                </h3>
                {emUso.map((med, indice) => (
                  <div key={indice} className="perfil-pet-destaque-item">
                    <strong>{nomeComConcentracao(med)}</strong>
                    {detalheDaMedicacao(med) && <span>{detalheDaMedicacao(med)}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Destaque 2: o que vem por aí, com a data em destaque (some se vazio) */}
            {proximos.length > 0 && (
              <div className="perfil-pet-destaque" aria-label="Próximos">
                <h3 className="perfil-pet-destaque-titulo">
                  <span className="perfil-pet-destaque-icone perfil-pet-destaque-icone-claro">
                    <i className="fa-regular fa-calendar"></i>
                  </span>
                  Próximos
                </h3>
                {proximos.map((item, indice) => (
                  <div key={item.id} className="perfil-pet-proximo">
                    {/* O mais perto fica roxo forte. "2026-11-12" -> "12" e "NOV" */}
                    <span
                      className={
                        indice === 0 ? "perfil-pet-data perfil-pet-data-forte" : "perfil-pet-data"
                      }
                    >
                      {item.data.slice(8)}
                      <br />
                      {MESES_CURTOS[Number(item.data.slice(5, 7)) - 1]}
                    </span>
                    <span className="perfil-pet-proximo-textos">
                      <strong>{item.titulo}</strong>
                      {item.detalhe && <span>{item.detalhe}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {historicoAberto && (
              <dl className="perfil-pet-historico">
                <div>
                  <dt>Vacinas</dt>
                  <dd>{resumoPrevencao(pet.vacinas || [])}</dd>
                  <Carteirinha tutorId={usuarioId} petId={pet.id} />
                </div>
                <div>
                  <dt>Vermifugação</dt>
                  <dd>{resumoPrevencao(pet.vermifugacoes || [])}</dd>
                </div>
                <div>
                  <dt>Antipulgas e carrapatos</dt>
                  <dd>{resumoPrevencao(pet.antiparasitarios || [])}</dd>
                </div>
                <div>
                  <dt>Doenças em tratamento</dt>
                  <dd>
                    {pet.tem_doencas_em_tratamento && pet.doencas_em_tratamento?.length ? (
                      // Cada doença com as medicações de uso contínuo dela embaixo
                      <ul className="perfil-pet-medicacoes">
                        {pet.doencas_em_tratamento.map((doenca, indice) => (
                          <li key={indice}>
                            <strong>{textoDoenca(doenca)}</strong>
                            {(pet.medicacoes || [])
                              .filter((med) => med?.doenca === doenca.doenca)
                              .map((med, i) => (
                                <span key={i} className="perfil-pet-doenca-med">
                                  {nomeComConcentracao(med)}
                                  {resumoMedicacao(med) && ` · ${resumoMedicacao(med)}`}
                                </span>
                              ))}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      textoSimNao(pet.tem_doencas_em_tratamento, [])
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Outros medicamentos</dt>
                  <dd>
                    {pet.outros_medicamentos?.length ? (
                      // Cada remédio com a frase pronta embaixo ("1 ml, 2 vezes ao dia...")
                      <ul className="perfil-pet-medicacoes">
                        {pet.outros_medicamentos.map((med, indice) => (
                          <li key={indice}>
                            <strong>{nomeComConcentracao(med)}</strong>
                            {resumoMedicacao(med) && (
                              <span className="perfil-pet-doenca-med">{resumoMedicacao(med)}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "Nenhum registrado"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Exames</dt>
                  <dd>{resumoPrevencao(pet.exames || [], "Último")}</dd>
                </div>
                <div>
                  <dt>Consultas</dt>
                  <dd>As anotações das consultas vão aparecer aqui</dd>
                </div>
                <div>
                  <dt>Doenças anteriores</dt>
                  <dd>
                    {textoSimNao(
                      pet.tem_doencas_anteriores,
                      pet.doencas_anteriores_detalhes?.length
                        ? pet.doencas_anteriores_detalhes.map(textoDoenca)
                        : pet.doencas_anteriores
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Alergias</dt>
                  <dd>{textoSimNao(pet.tem_alergia, pet.alergias)}</dd>
                </div>
                <div>
                  <dt>Cirurgias anteriores</dt>
                  <dd>{textoSimNao(pet.tem_cirurgia, pet.cirurgias)}</dd>
                </div>
                {pet.especie === "Felino" && (
                  <>
                    <div>
                      <dt>Testado para FIV</dt>
                      <dd>{resumoTeste(pet.testes_felinos?.fiv)}</dd>
                    </div>
                    <div>
                      <dt>Testado para FeLV</dt>
                      <dd>{resumoTeste(pet.testes_felinos?.felv)}</dd>
                    </div>
                  </>
                )}
                <div>
                  <dt>Observações</dt>
                  <dd>{pet.observacoes || "Não preenchido"}</dd>
                </div>
              </dl>
            )}
          </section>

          <section className="perfil-pet-secao">
            <h2 className="perfil-pet-secao-titulo">Próximos agendamentos</h2>
            <p className="perfil-pet-vazio">Nenhum agendamento por enquanto</p>
          </section>
        </>
      )}

      <MenuInferior />
    </div>
  );
}
