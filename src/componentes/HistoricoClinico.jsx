import { useState } from "react";
import { IoChevronDown, IoChevronUp, IoPencil, IoTrashOutline } from "react-icons/io5";
import Medicacoes, {
  medicacaoVazia,
  nomeComConcentracao,
  resumoMedicacao,
} from "./Medicacoes.jsx";
import Prevencoes, { resumoPrevencao } from "./Prevencoes.jsx";
import RegistrarVacinas from "./RegistrarVacinas.jsx";
import CampoData from "./CampoData.jsx";
import Carteirinha from "./Carteirinha.jsx";
import {
  deDataISO,
  validarData,
  paraDataISO,
  formatarMesAno,
  validarMesAno,
  paraMesISO,
  deMesISO,
} from "../formatadores.js";
import { hojeISO } from "../lembretes.js";
import { TIPOS_EXAME } from "../exames.js";
import "./historicoclinico.css";
import "./vacinas.css";

const LIMITE_ITENS = 20;

// Teste de FIV ou FeLV: testado (Sim/Não) e a lista de vezes que foi feito,
// cada uma com o resultado e a data ({ resultado: "Negativo", data: "2026-09-10" })
function testeInicial(teste) {
  return {
    testado: teste?.testado ?? null, // null = ainda não respondeu
    registros: (teste?.registros || []).filter((registro) => registro?.data),
  };
}

// "Última: Negativo · 10/09/2026" / "Não testado" / "Não preenchido"
export function resumoTeste(teste) {
  if (teste?.testado === false) return "Não testado";
  if (teste?.testado && teste.registros?.length) return resumoPrevencao(teste.registros);
  return "Não preenchido";
}

// Os dados do histórico como vêm do banco (ou vazios, num pet novo)
export function historicoInicial(pet) {
  return {
    temAlergia: pet?.tem_alergia ?? null, // null = ainda não respondeu
    alergias: pet?.alergias?.length ? pet.alergias : [""],
    temCirurgia: pet?.tem_cirurgia ?? null,
    cirurgias: pet?.cirurgias?.length ? pet.cirurgias : [""],
    temDoencasEmTratamento: pet?.tem_doencas_em_tratamento ?? null,
    doencasEmTratamento: doencasEmTratamentoDaTela(pet),
    // Pet que já tinha itens salvos antes do Sim/Não existir: abre com "Sim"
    temDoencasAnteriores:
      pet?.tem_doencas_anteriores ?? (pet?.doencas_anteriores?.length ? true : null),
    doencasAnteriores: doencasAnterioresIniciais(pet),
    vermifugacoes: pet?.vermifugacoes || [],
    antiparasitarios: pet?.antiparasitarios || [],
    vacinas: pet?.vacinas || [],
    // Remédios que não são de doença em tratamento (ex.: antibiótico por 7 dias)
    outrosMedicamentos: (pet?.outros_medicamentos || []).map(medicacaoDaTela),
    exames: pet?.exames || [],
    // Só gatos: testes de FIV e FeLV
    testeFiv: testeInicial(pet?.testes_felinos?.fiv),
    testeFelv: testeInicial(pet?.testes_felinos?.felv),
    observacoes: pet?.observacoes || "",
  };
}

// Tira as linhas em branco da lista (ex.: o campo que a pessoa abriu e não preencheu)
export function itensPreenchidos(lista) {
  return lista.map((item) => item.trim()).filter(Boolean);
}

// Resumo que aparece com o tópico fechado: "Frango, Dipirona" / "Não tem" / "Não preenchido"
function resumoSimNao(tem, lista) {
  if (tem === false) return "Não tem";
  const itens = itensPreenchidos(lista);
  if (tem === true && itens.length) return itens.join(", ");
  return "Não preenchido";
}

// Doenças em tratamento e anteriores: cada uma com os medicamentos (opcional)
// e a data do diagnóstico (opcional, só mês e ano).
// Ex.: { doenca: "Diabetes", medicamentos: ["Insulina"], diagnostico: "2026-08" }
function doencaVazia() {
  return { id: crypto.randomUUID(), doenca: "", medicamentos: [""], diagnostico: "" };
}

// As doenças como vêm do banco, prontas para a tela
function doencasDaTela(salvas) {
  if (!salvas.length) return [doencaVazia()];

  return salvas.map((item) => ({
    id: crypto.randomUUID(), // só para a tela
    fechada: Boolean(item.doenca), // só para a tela: doença já salva abre fechada (resumo)
    doenca: item.doenca || "",
    medicamentos: item.medicamentos?.length ? item.medicamentos : [""],
    diagnostico: deMesISO(item.diagnostico),
  }));
}

// Uma medicação salva, pronta para a tela (o id é só para a tela, não é salvo)
function medicacaoDaTela(med) {
  return {
    ...medicacaoVazia(),
    ...med,
    id: crypto.randomUUID(),
    ultimaDose: med.ultimaDose ? deDataISO(med.ultimaDose) : "",
  };
}

// Doenças em tratamento: cada doença com as próprias medicações de uso contínuo.
// No banco, as medicações ficam todas juntas em "medicacoes" (é de lá que saem os
// lembretes), cada uma com o nome da doença: { nome: "Insulina", ..., doenca: "Diabetes" }
function doencasEmTratamentoDaTela(pet) {
  const salvas = pet?.doencas_em_tratamento || [];
  if (!salvas.length) return [doencaVazia()];

  const medicacoes = (pet?.medicacoes || []).filter((med) => med?.doenca);

  return doencasDaTela(salvas).map((item, indice) => {
    const daDoenca = medicacoes
      .filter((med) => med.doenca === item.doenca)
      .map(medicacaoDaTela);
    return {
      ...item,
      temMedicacao: salvas[indice].temMedicacao ?? (daDoenca.length ? true : null),
      medicacoes: daDoenca,
    };
  });
}

// As medicações de todas as doenças marcadas com "Sim", cada uma com o nome da doença
export function medicacoesDasDoencas(lista) {
  return lista
    .filter((item) => item.doenca.trim() && item.temMedicacao)
    .flatMap((item) =>
      item.medicacoes.map((med) => ({ ...med, doenca: item.doenca.trim() }))
    );
}

function doencasAnterioresIniciais(pet) {
  // Pets salvos antes dos medicamentos só têm os nomes (doencas_anteriores)
  const salvas =
    pet?.doencas_anteriores_detalhes?.length
      ? pet.doencas_anteriores_detalhes
      : (pet?.doencas_anteriores || []).map((doenca) => ({ doenca, medicamentos: [] }));

  return doencasDaTela(salvas);
}

// Só as doenças preenchidas, sem linhas em branco: para salvar no banco
export function doencasPreenchidas(lista) {
  return lista
    .filter((item) => item.doenca.trim())
    .map((item) => ({
      doenca: item.doenca.trim(),
      medicamentos: itensPreenchidos(item.medicamentos),
      // Data pela metade (ex.: "08") fica de fora; ao salvar, erroNasDatasDoencas avisa
      diagnostico:
        item.diagnostico && !validarMesAno(item.diagnostico)
          ? paraMesISO(item.diagnostico)
          : null,
    }));
}

// Confere a data do diagnóstico de cada doença preenchida.
// Devolve a mensagem de erro, ou "" se estiver tudo certo.
export function erroNasDatasDoencas(lista) {
  const mesAtual = hojeISO().slice(0, 7); // "2026-10"

  for (const item of lista) {
    const doenca = item.doenca.trim();
    if (!doenca || !item.diagnostico) continue;

    const erroData = validarMesAno(item.diagnostico);
    if (erroData) return `${doenca}: ${erroData}`;

    if (paraMesISO(item.diagnostico) > mesAtual) {
      return `${doenca}: a data do diagnóstico não pode ser no futuro.`;
    }
  }

  return "";
}

// "Diabetes (Insulina) · 08/2026" / "Otite (Otogard, Surolan)" / "Giárdia"
export function textoDoenca(item) {
  let texto = item.doenca;
  if (item.medicamentos?.length) texto += ` (${item.medicamentos.join(", ")})`;
  const data = deMesISO(item.diagnostico);
  if (data) texto += ` · ${data}`;
  return texto;
}

// Resumo de Doenças em tratamento com o tópico fechado:
// "Diabetes · 08/2026 (1 medicação), Osteoartrite" / "Não tem" / "Não preenchido"
function resumoDoencasEmTratamento(historico) {
  if (historico.temDoencasEmTratamento === false) return "Não tem";
  if (!historico.temDoencasEmTratamento) return "Não preenchido";

  const textos = historico.doencasEmTratamento
    .filter((item) => item.doenca.trim())
    .map((item) => {
      const texto = textoDoenca(doencasPreenchidas([item])[0]);
      const total = item.temMedicacao
        ? item.medicacoes.filter((med) => med.nome.trim()).length
        : 0;
      if (!total) return texto;
      return `${texto} (${total === 1 ? "1 medicação" : `${total} medicações`})`;
    });

  return textos.length ? textos.join(", ") : "Não preenchido";
}

// Cada tópico (Alergias, Cirurgias...) é uma gavetinha: fechada, mostra só o resumo
function Topico({ titulo, resumo, aberto, aoAlternar, children }) {
  return (
    <div className="topico">
      <button
        type="button"
        className="topico-titulo"
        onClick={aoAlternar}
        aria-expanded={aberto}
      >
        <span>
          <strong>{titulo}</strong>
          {!aberto && (
            <span
              className={
                resumo === "Não preenchido" || resumo === "Nenhum registrado"
                  ? "topico-resumo topico-resumo-vazio"
                  : "topico-resumo"
              }
            >
              {resumo}
            </span>
          )}
        </span>
        {aberto ? <IoChevronUp /> : <IoChevronDown />}
      </button>

      {aberto && <div className="topico-corpo">{children}</div>}
    </div>
  );
}

// Exportado: o "+" da Agenda usa o mesmo Sim/Não (remédio e preparo do exame)
export function SimNao({ valor, aoEscolher }) {
  return (
    <div className="sim-nao">
      {[
        ["Sim", true],
        ["Não", false],
      ].map(([texto, opcao]) => (
        <button
          key={texto}
          type="button"
          className={valor === opcao ? "sim-nao-opcao sim-nao-ativo" : "sim-nao-opcao"}
          onClick={() => aoEscolher(opcao)}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}

// Lista de campos com o "+" para adicionar mais um e a lixeira para remover
function ListaComMais({ itens, aoMudar, placeholder, textoAdicionar, textoRemover }) {
  function mudarItem(indice, valor) {
    aoMudar(itens.map((item, i) => (i === indice ? valor : item)));
  }

  function removerItem(indice) {
    const novaLista = itens.filter((_, i) => i !== indice);
    // Sempre deixa pelo menos um campo para digitar
    aoMudar(novaLista.length ? novaLista : [""]);
  }

  return (
    <div className="lista-mais">
      {itens.map((item, indice) => (
        <div key={indice} className="lista-mais-linha">
          <input
            type="text"
            value={item}
            placeholder={placeholder}
            maxLength={100}
            onChange={(evento) => mudarItem(indice, evento.target.value)}
          />
          <button
            type="button"
            className="lista-mais-remover"
            aria-label={textoRemover}
            onClick={() => removerItem(indice)}
          >
            <IoTrashOutline />
          </button>
        </div>
      ))}

      {/* Limite de itens (o banco também confere esse limite) */}
      {itens.length < LIMITE_ITENS && (
        <button
          type="button"
          className="lista-mais-adicionar"
          onClick={() => aoMudar([...itens, ""])}
        >
          + {textoAdicionar}
        </button>
      )}
    </div>
  );
}

// Lista de doenças (em tratamento ou anteriores): cada uma num cartão, com o nome,
// a data do diagnóstico (opcional) e, só se tiver rotuloMedicamento, os medicamentos
function ListaDoencas({
  lista,
  aoMudar,
  exemploDoenca,
  rotuloMedicamento,
  exemploMedicamento,
  comMedicacoes, // só nas doenças em tratamento: a pergunta da medicação contínua
  textoAdicionar,
  textoRemover,
}) {
  function mudarCampos(id, campos) {
    aoMudar(lista.map((item) => (item.id === id ? { ...item, ...campos } : item)));
  }

  function mudarItem(id, campo, valor) {
    mudarCampos(id, { [campo]: valor });
  }

  function remover(id) {
    const restantes = lista.filter((item) => item.id !== id);
    aoMudar(restantes.length ? restantes : [doencaVazia()]);
  }

  // Avisos do "Pronto", por doença
  const [erros, setErros] = useState({});

  // "fechada" fica dentro da própria doença (só na tela, não vai para o banco):
  // assim o cartão continua aberto ou fechado mesmo se o tópico fechar e abrir
  function abrir(id) {
    mudarItem(id, "fechada", false);
  }

  // "Pronto": confere a doença e fecha o cartão (ainda não grava no banco;
  // isso é no "Salvar" do final)
  function pronto(item) {
    let erro = "";
    if (!item.doenca.trim()) {
      erro = "Escreva qual é a doença.";
    } else {
      erro = erroNasDatasDoencas([item]);
    }
    if (!erro && comMedicacoes && item.temMedicacao) {
      if (!item.medicacoes.some((med) => med.nome.trim())) {
        erro = "Escreva o nome da medicação ou marque Não.";
      }
    }

    setErros({ ...erros, [item.id]: erro });
    if (!erro) mudarItem(item.id, "fechada", true);
  }

  return (
    <div className="lista-mais">
      {lista.map((item) =>
        item.fechada ? (
          // Fechada: "Diabetes · 08/2026" e as medicações embaixo
          <div key={item.id} className="doenca-fechada">
            <div>
              <strong>{textoDoenca(doencasPreenchidas([item])[0])}</strong>
              {comMedicacoes &&
                item.temMedicacao &&
                item.medicacoes
                  .filter((med) => med.nome.trim())
                  .map((med) => (
                    <span key={med.id} className="doenca-fechada-med">
                      {nomeComConcentracao(med)}
                      {resumoMedicacao(med) && ` · ${resumoMedicacao(med)}`}
                    </span>
                  ))}
            </div>
            <button
              type="button"
              className="doenca-alterar"
              aria-label={`Alterar ${item.doenca.trim()}`}
              onClick={() => abrir(item.id)}
            >
              <IoPencil />
            </button>
          </div>
        ) : (
        <div key={item.id} className="doenca-cartao">
          <span className="doenca-rotulo">
            Qual doença? <span className="obrigatorio">*</span>
          </span>
          <div className="lista-mais-linha">
            <input
              type="text"
              aria-label="Qual doença?"
              value={item.doenca}
              placeholder={exemploDoenca}
              maxLength={100}
              onChange={(evento) => mudarItem(item.id, "doenca", evento.target.value)}
            />
            <button
              type="button"
              className="lista-mais-remover"
              aria-label={textoRemover}
              onClick={() => remover(item.id)}
            >
              <IoTrashOutline />
            </button>
          </div>

          <label className="doenca-rotulo">
            Data do diagnóstico
            <input
              type="text"
              className="doenca-data"
              inputMode="numeric"
              placeholder="MM/AAAA"
              maxLength={7}
              value={item.diagnostico}
              onChange={(evento) =>
                mudarItem(item.id, "diagnostico", formatarMesAno(evento.target.value))
              }
            />
          </label>

          {/* Doenças em tratamento: as medicações de uso contínuo ficam dentro da doença */}
          {comMedicacoes && (
            <>
              <span className="topico-pergunta">Faz o uso de medicação contínua?</span>
              <SimNao
                valor={item.temMedicacao ?? null}
                aoEscolher={(valor) =>
                  // Sim sem nenhuma medicação: já abre um cartão em branco para preencher
                  mudarCampos(item.id, {
                    temMedicacao: valor,
                    medicacoes:
                      valor && !item.medicacoes?.length
                        ? [medicacaoVazia()]
                        : item.medicacoes || [],
                  })
                }
              />
              {item.temMedicacao && (
                <Medicacoes
                  embutida
                  medicacoes={item.medicacoes}
                  aoMudar={(medicacoes) => mudarItem(item.id, "medicacoes", medicacoes)}
                />
              )}
            </>
          )}

          {/* Só nas doenças anteriores: os medicamentos usados (texto simples) */}
          {rotuloMedicamento && (
            <>
              <span className="doenca-rotulo">{rotuloMedicamento}</span>
              <ListaComMais
                itens={item.medicamentos}
                aoMudar={(medicamentos) => mudarItem(item.id, "medicamentos", medicamentos)}
                placeholder={exemploMedicamento}
                textoAdicionar="Adicionar medicamento"
                textoRemover="Remover medicamento"
              />
            </>
          )}

          {erros[item.id] && <span className="aviso-cpf">{erros[item.id]}</span>}
          <button type="button" className="doenca-pronto" onClick={() => pronto(item)}>
            Pronto
          </button>
        </div>
        )
      )}

      {lista.length < LIMITE_ITENS && (
        <button
          type="button"
          className="lista-mais-adicionar"
          onClick={() => aoMudar([...lista, doencaVazia()])}
        >
          + {textoAdicionar}
        </button>
      )}
    </div>
  );
}

// Registrar um teste de FIV/FeLV: resultado e data
function RegistrarTeste({ aoAdicionar, aoCancelar }) {
  const [resultado, setResultado] = useState("");
  const [data, setData] = useState("");
  const [erro, setErro] = useState("");

  function adicionar() {
    if (!resultado) {
      setErro("Escolha o resultado.");
      return;
    }
    const erroData = validarData(data);
    if (erroData) {
      setErro(erroData);
      return;
    }
    if (paraDataISO(data) > hojeISO()) {
      setErro("A data não pode ser no futuro.");
      return;
    }
    aoAdicionar({ resultado, data: paraDataISO(data), autor: "tutor" });
  }

  return (
    <div className="prev-novo">
      <div className="med-campo">
        <span className="med-rotulo">
          Resultado <span className="obrigatorio">*</span>
        </span>
        <div className="sim-nao">
          {["Negativo", "Positivo"].map((opcao) => (
            <button
              key={opcao}
              type="button"
              className={resultado === opcao ? "sim-nao-opcao sim-nao-ativo" : "sim-nao-opcao"}
              onClick={() => setResultado(opcao)}
            >
              {opcao}
            </button>
          ))}
        </div>
      </div>

      <label>
        <span>
          Data do teste <span className="obrigatorio">*</span>
        </span>
        <CampoData valor={data} aoMudar={setData} />
      </label>

      {erro && <span className="aviso-cpf">{erro}</span>}

      <div className="prev-botoes">
        <button type="button" className="prev-cancelar" onClick={aoCancelar}>
          Cancelar
        </button>
        <button type="button" className="prev-adicionar" onClick={adicionar}>
          Adicionar
        </button>
      </div>
    </div>
  );
}

// Registrar um exame já feito: qual exame, data, local e resultado
// (o mesmo que o "Registrar exame" do "+" da Agenda)
function RegistrarExame({ aoAdicionar, aoCancelar }) {
  const [tipo, setTipo] = useState("");
  const [nomeOutro, setNomeOutro] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [resultado, setResultado] = useState("");
  const [erro, setErro] = useState("");

  function adicionar() {
    if (!tipo) {
      setErro("Escolha o exame.");
      return;
    }
    if (tipo === "Outro" && !nomeOutro.trim()) {
      setErro("Escreva o nome do exame.");
      return;
    }
    const erroData = validarData(data);
    if (erroData) {
      setErro(erroData);
      return;
    }
    if (paraDataISO(data) > hojeISO()) {
      setErro("A data do exame não pode ser no futuro.");
      return;
    }
    aoAdicionar({
      tipo,
      nome: tipo === "Outro" ? nomeOutro.trim() : tipo,
      data: paraDataISO(data),
      local: local.trim(),
      resultado: resultado.trim(),
      autor: "tutor",
    });
  }

  return (
    <div className="prev-novo">
      <div className="med-campo">
        <span className="med-rotulo">
          Qual exame? <span className="obrigatorio">*</span>
        </span>
        <div className="vacinas-opcoes">
          {TIPOS_EXAME.map((opcao) => (
            <button
              key={opcao}
              type="button"
              className={tipo === opcao ? "sim-nao-opcao sim-nao-ativo" : "sim-nao-opcao"}
              onClick={() => setTipo(opcao)}
            >
              {opcao}
            </button>
          ))}
        </div>
      </div>

      {tipo === "Outro" && (
        <label>
          <span>
            Nome do exame <span className="obrigatorio">*</span>
          </span>
          <input
            type="text"
            value={nomeOutro}
            maxLength={100}
            onChange={(evento) => setNomeOutro(evento.target.value)}
          />
        </label>
      )}

      <label>
        <span>
          Data do exame <span className="obrigatorio">*</span>
        </span>
        <CampoData valor={data} aoMudar={setData} />
      </label>

      <label>
        Local
        <input
          type="text"
          value={local}
          placeholder="Ex.: Clínica Patas"
          maxLength={150}
          onChange={(evento) => setLocal(evento.target.value)}
        />
      </label>

      <label>
        Resultado
        <textarea
          className="topico-texto"
          value={resultado}
          placeholder="Ex.: tudo normal; plaquetas um pouco baixas"
          maxLength={500}
          rows={3}
          onChange={(evento) => setResultado(evento.target.value)}
        />
      </label>

      {erro && <span className="aviso-cpf">{erro}</span>}

      <div className="prev-botoes">
        <button type="button" className="prev-cancelar" onClick={aoCancelar}>
          Cancelar
        </button>
        <button type="button" className="prev-adicionar" onClick={adicionar}>
          Adicionar
        </button>
      </div>
    </div>
  );
}

// Resumo dos outros medicamentos com o tópico fechado: "Amoxicilina, Dipirona 500 mg/ml"
function resumoOutrosMedicamentos(lista) {
  const nomes = lista.filter((med) => med.nome.trim()).map(nomeComConcentracao);
  return nomes.length ? nomes.join(", ") : "Nenhum registrado";
}

// Testado para FIV / FeLV: o Sim abre a lista de testes (igual à Vermifugação)
function TesteFelino({ nomeTeste, teste, aoMudar }) {
  return (
    <>
      <SimNao valor={teste.testado} aoEscolher={(valor) => aoMudar({ ...teste, testado: valor })} />
      {teste.testado && (
        <Prevencoes
          registros={teste.registros}
          aoMudar={(registros) => aoMudar({ ...teste, registros })}
          nome={`teste de ${nomeTeste}`}
          FormularioNovo={RegistrarTeste}
        />
      )}
    </>
  );
}

// Conteúdo da gaveta "Histórico clínico" do cadastro do pet.
// Os dados ficam no FormularioPet (historico), que salva tudo junto com o pet.
// tutorId e petId: para a carteirinha. Pet novo (sem petId): os arquivos escolhidos
// ficam em carteirinhasPendentes até o FormularioPet salvar o pet
export default function HistoricoClinico({
  historico,
  aoMudar,
  especie,
  tutorId,
  petId,
  carteirinhasPendentes,
  aoMudarCarteirinhasPendentes,
}) {
  const [abertos, setAbertos] = useState({});

  function alternar(topico) {
    setAbertos({ ...abertos, [topico]: !abertos[topico] });
  }

  function mudar(campo, valor) {
    aoMudar({ ...historico, [campo]: valor });
  }

  const observacoes = historico.observacoes.trim();

  return (
    <div className="historico">
      <Topico
        titulo="Vacinas"
        resumo={resumoPrevencao(historico.vacinas)}
        aberto={abertos.vacinas}
        aoAlternar={() => alternar("vacinas")}
      >
        <Prevencoes
          registros={historico.vacinas}
          aoMudar={(lista) => mudar("vacinas", lista)}
          nome="vacina"
          FormularioNovo={RegistrarVacinas}
          propsFormulario={{ especie }}
        />
        <Carteirinha
          tutorId={tutorId}
          petId={petId}
          editar
          pendentes={carteirinhasPendentes}
          aoMudarPendentes={aoMudarCarteirinhasPendentes}
        />
      </Topico>

      <Topico
        titulo="Vermifugação"
        resumo={resumoPrevencao(historico.vermifugacoes)}
        aberto={abertos.vermifugacoes}
        aoAlternar={() => alternar("vermifugacoes")}
      >
        <Prevencoes
          registros={historico.vermifugacoes}
          aoMudar={(lista) => mudar("vermifugacoes", lista)}
          nome="vermifugação"
          rotuloProduto="Qual vermífugo?"
          exemploProduto="Ex: Drontal"
        />
      </Topico>

      <Topico
        titulo="Antipulgas e carrapatos"
        resumo={resumoPrevencao(historico.antiparasitarios)}
        aberto={abertos.antiparasitarios}
        aoAlternar={() => alternar("antiparasitarios")}
      >
        <Prevencoes
          registros={historico.antiparasitarios}
          aoMudar={(lista) => mudar("antiparasitarios", lista)}
          nome="antiparasitário"
          rotuloProduto="Qual antiparasitário?"
          exemploProduto="Ex: Bravecto"
        />
      </Topico>

      <Topico
        titulo="Doenças em tratamento"
        resumo={resumoDoencasEmTratamento(historico)}
        aberto={abertos.doencasEmTratamento}
        aoAlternar={() => alternar("doencasEmTratamento")}
      >
        {/* A frase aparece assim que abre o tópico, antes do Sim/Não */}
        <p className="topico-dica">
          Doenças diagnosticadas em que o animal faz tratamento contínuo. Ex.: diabetes, osteoartrite.
        </p>
        <SimNao
          valor={historico.temDoencasEmTratamento}
          aoEscolher={(valor) => mudar("temDoencasEmTratamento", valor)}
        />
        {/* Sim: cada doença num cartão, com as medicações dela dentro */}
        {historico.temDoencasEmTratamento && (
          <ListaDoencas
            lista={historico.doencasEmTratamento}
            aoMudar={(lista) => mudar("doencasEmTratamento", lista)}
            exemploDoenca="Ex: Diabetes"
            comMedicacoes
            textoAdicionar="Adicionar doença em tratamento"
            textoRemover="Remover doença em tratamento"
          />
        )}
      </Topico>

      {/* Remédios que não são de uma doença em tratamento (mesmos campos) */}
      <Topico
        titulo="Outros medicamentos"
        resumo={resumoOutrosMedicamentos(historico.outrosMedicamentos)}
        aberto={abertos.outrosMedicamentos}
        aoAlternar={() => alternar("outrosMedicamentos")}
      >
        <Medicacoes
          medicacoes={historico.outrosMedicamentos}
          aoMudar={(lista) => mudar("outrosMedicamentos", lista)}
        />
      </Topico>

      <Topico
        titulo="Exames"
        resumo={resumoPrevencao(historico.exames, "Último")}
        aberto={abertos.exames}
        aoAlternar={() => alternar("exames")}
      >
        <Prevencoes
          registros={historico.exames}
          aoMudar={(lista) => mudar("exames", lista)}
          nome="exame"
          FormularioNovo={RegistrarExame}
        />
      </Topico>

      {/* Por enquanto só o aviso: as anotações do veterinário entram depois */}
      <Topico
        titulo="Consultas"
        resumo="Nenhum registrado"
        aberto={abertos.consultas}
        aoAlternar={() => alternar("consultas")}
      >
        <p className="topico-dica">As anotações das consultas vão aparecer aqui</p>
      </Topico>

      <Topico
        titulo="Doenças anteriores"
        resumo={resumoSimNao(
          historico.temDoencasAnteriores,
          doencasPreenchidas(historico.doencasAnteriores).map(textoDoenca)
        )}
        aberto={abertos.doencasAnteriores}
        aoAlternar={() => alternar("doencasAnteriores")}
      >
        {/* A frase aparece assim que abre o tópico, antes do Sim/Não */}
        <p className="topico-dica">
          Doenças já tratadas anteriormente para compor o histórico de alterações.
        </p>
        <SimNao
          valor={historico.temDoencasAnteriores}
          aoEscolher={(valor) => mudar("temDoencasAnteriores", valor)}
        />
        {historico.temDoencasAnteriores && (
          <ListaDoencas
            lista={historico.doencasAnteriores}
            aoMudar={(lista) => mudar("doencasAnteriores", lista)}
            exemploDoenca="Ex: Giárdia"
            rotuloMedicamento="Medicamento usado"
            exemploMedicamento="Ex: Otogard"
            textoAdicionar="Adicionar doença anterior"
            textoRemover="Remover doença anterior"
          />
        )}
      </Topico>

      <Topico
        titulo="Alergias"
        resumo={resumoSimNao(historico.temAlergia, historico.alergias)}
        aberto={abertos.alergias}
        aoAlternar={() => alternar("alergias")}
      >
        <SimNao
          valor={historico.temAlergia}
          aoEscolher={(valor) => mudar("temAlergia", valor)}
        />
        {historico.temAlergia && (
          <>
            <span className="doenca-rotulo">
              Qual alergia? <span className="obrigatorio">*</span>
            </span>
            <ListaComMais
              itens={historico.alergias}
              aoMudar={(lista) => mudar("alergias", lista)}
              placeholder="Ex: Frango"
              textoAdicionar="Adicionar alergia"
              textoRemover="Remover alergia"
            />
          </>
        )}
      </Topico>

      <Topico
        titulo="Cirurgias anteriores"
        resumo={resumoSimNao(historico.temCirurgia, historico.cirurgias)}
        aberto={abertos.cirurgias}
        aoAlternar={() => alternar("cirurgias")}
      >
        <SimNao
          valor={historico.temCirurgia}
          aoEscolher={(valor) => mudar("temCirurgia", valor)}
        />
        {historico.temCirurgia && (
          <>
            <p className="topico-dica">Não precisa incluir a castração.</p>
            <span className="doenca-rotulo">
              Qual cirurgia? <span className="obrigatorio">*</span>
            </span>
            <ListaComMais
              itens={historico.cirurgias}
              aoMudar={(lista) => mudar("cirurgias", lista)}
              placeholder="Ex: Retirada de nódulo"
              textoAdicionar="Adicionar cirurgia"
              textoRemover="Remover cirurgia"
            />
          </>
        )}
      </Topico>

      {especie === "Felino" && (
        <>
          <Topico
            titulo="Testado para FIV"
            resumo={resumoTeste(historico.testeFiv)}
            aberto={abertos.testeFiv}
            aoAlternar={() => alternar("testeFiv")}
          >
            <TesteFelino
              nomeTeste="FIV"
              teste={historico.testeFiv}
              aoMudar={(teste) => mudar("testeFiv", teste)}
            />
          </Topico>

          <Topico
            titulo="Testado para FeLV"
            resumo={resumoTeste(historico.testeFelv)}
            aberto={abertos.testeFelv}
            aoAlternar={() => alternar("testeFelv")}
          >
            <TesteFelino
              nomeTeste="FeLV"
              teste={historico.testeFelv}
              aoMudar={(teste) => mudar("testeFelv", teste)}
            />
          </Topico>
        </>
      )}

      <Topico
        titulo="Observações"
        resumo={observacoes || "Não preenchido"}
        aberto={abertos.observacoes}
        aoAlternar={() => alternar("observacoes")}
      >
        <textarea
          className="topico-texto"
          value={historico.observacoes}
          placeholder="Ex.: tem medo de secador, já teve convulsão em 2023..."
          maxLength={1000}
          rows={4}
          onChange={(evento) => mudar("observacoes", evento.target.value)}
        />
      </Topico>
    </div>
  );
}
