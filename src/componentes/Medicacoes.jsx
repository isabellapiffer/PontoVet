import { useState } from "react";
import { IoChevronDown, IoChevronUp, IoTrashOutline } from "react-icons/io5";
import { TEMPOS_COM_LEMBRETE, hojeISO, somarIntervalo } from "../lembretes.js";
import { validarData, paraDataISO } from "../formatadores.js";
import CampoData from "./CampoData.jsx";
import ListaOpcoes from "./ListaOpcoes.jsx";
import "./medicacoes.css";

const LIMITE_MEDICACOES = 20;

export const UNIDADES_DOSE = [
  "mg",
  "ml",
  "g",
  "UI",
  "gotas",
  "comprimido(s)",
  "mcg",
  "pipeta(s)",
  "cápsula(s)",
  "aplicação",
];

// Unidades da concentração (o que vem escrito na caixa: "500 mg", "50 mg/ml")
export const UNIDADES_CONCENTRACAO = ["mg", "mg/ml", "mcg", "g", "UI", "UI/ml", "%"];

// Opções de tempo: [valor guardado, singular, plural]
const TEMPOS = [
  ["hora", "hora", "horas"],
  ["dia", "dia", "dias"],
  ["semana", "semana", "semanas"],
  ["mes", "mês", "meses"],
  ["ano", "ano", "anos"],
];

function nomeTempo(valor, quantidade) {
  const tempo = TEMPOS.find(([v]) => v === valor);
  if (!tempo) return "";
  return Number(quantidade) === 1 ? tempo[1] : tempo[2];
}

// Uma medicação nova, ainda em branco
export function medicacaoVazia() {
  return {
    id: crypto.randomUUID(), // só para o React saber qual é qual na lista
    nome: "",
    concentracao: "",
    concentracaoUnidade: "",
    dose: "",
    unidade: "",
    vezes: "",
    intervalo: "",
    intervaloTempo: "hora", // ex.: 2 vezes a cada 12 horas
    ateNovasRecomendacoes: false,
    duracao: "",
    duracaoTempo: "dia",
    ultimaDose: "", // na tela fica "01/10/2026"; no banco, "2026-10-01"
  };
}

// Nome com a concentração: "Dipirona 500 mg/ml"
export function nomeComConcentracao(med) {
  const concentracao = med.concentracao
    ? `${med.concentracao} ${med.concentracaoUnidade || ""}`.trim()
    : "";
  return [med.nome?.trim(), concentracao].filter(Boolean).join(" ");
}

// Frase pronta: "1 ml, 2 vezes ao dia, durante 7 dias"
export function resumoMedicacao(med) {
  const partes = [];

  if (med.dose) partes.push(`${med.dose} ${med.unidade}`.trim());

  if (med.vezes) {
    const vezes = `${med.vezes} ${Number(med.vezes) === 1 ? "vez" : "vezes"}`;
    if (Number(med.intervalo) === 1) {
      const porTempo = {
        hora: "por hora",
        dia: "ao dia",
        semana: "por semana",
        mes: "por mês",
        ano: "por ano",
      };
      partes.push(`${vezes} ${porTempo[med.intervaloTempo]}`);
    } else if (med.intervalo) {
      partes.push(
        `${vezes} a cada ${med.intervalo} ${nomeTempo(med.intervaloTempo, med.intervalo)}`
      );
    }
  }

  if (med.ateNovasRecomendacoes) {
    partes.push("até novas recomendações");
  } else if (med.duracao) {
    partes.push(`durante ${med.duracao} ${nomeTempo(med.duracaoTempo, med.duracao)}`);
  }

  return partes.join(", ");
}

// Confere uma lista de medicações antes de salvar (mesmas regras do cadastro do pet).
// Devolve a mensagem de erro, ou "" se estiver tudo certo.
export function erroNasMedicacoes(medicacoes) {
  for (const med of medicacoes) {
    const { id, nome, intervalo, intervaloTempo, duracaoTempo, doenca, registradoEm, ...resto } = med;
    // Algo preenchido mas sem nome
    if (!nome.trim()) {
      if (Object.values(resto).some(Boolean)) {
        return "Escreva o nome de cada medicação (ou remova a que está em branco).";
      }
      continue;
    }
    // Data da última dose (só nas de semana, mês ou ano)
    if (TEMPOS_COM_LEMBRETE.includes(intervaloTempo) && med.ultimaDose) {
      const erroData = validarData(med.ultimaDose);
      if (erroData) return `${nome}: ${erroData}`;
      if (paraDataISO(med.ultimaDose) > hojeISO()) {
        return `${nome}: a data da última dose não pode ser no futuro.`;
      }
    }
  }
  return "";
}

// Uma medicação da tela pronta para o banco: sem o id (é só da tela), nome sem
// espaços sobrando e a data da última dose só quando ela serve para o lembrete
export function medicacaoParaSalvar({ id, ...med }) {
  return {
    ...med,
    nome: med.nome.trim(),
    ultimaDose:
      TEMPOS_COM_LEMBRETE.includes(med.intervaloTempo) && med.ultimaDose
        ? paraDataISO(med.ultimaDose)
        : null,
  };
}

// Até quando vai a medicação: data em que foi registrada + duração.
// "Até novas recomendações" (ou sem a data do registro) = null, sem fim conhecido
export function fimDaMedicacao(med) {
  if (med.ateNovasRecomendacoes || !med.duracao || !med.registradoEm) return null;
  // Duração em horas: somarIntervalo não soma horas, então cada 24 horas viram 1 dia
  // ("durante 12 horas" = mesmo dia; "durante 48 horas" = 2 dias depois).
  // Sem isso ficaria "Em tratamento" para sempre
  if (med.duracaoTempo === "hora") {
    const dias = Math.floor(Number(med.duracao) / 24);
    return somarIntervalo(med.registradoEm, dias, "dia");
  }
  return somarIntervalo(med.registradoEm, med.duracao, med.duracaoTempo);
}

// Só números (para vezes, intervalo e duração)
function soNumeros(texto) {
  return texto.replace(/\D/g, "");
}

// Dose aceita meio comprimido: "1/2", "0,5", "1,5"
export function soDose(texto) {
  return texto.replace(/[^\d,./]/g, "");
}

// Hora(s), dia(s)...: guarda "mes" e mostra "mês" ou "meses" conforme a quantidade
function SeletorTempo({ valor, quantidade, aoMudar }) {
  return (
    <ListaOpcoes
      placeholder="Tempo"
      opcoes={TEMPOS.map(([v]) => [v, nomeTempo(v, quantidade || 1)])}
      valor={valor}
      aoMudar={aoMudar}
    />
  );
}

// embutida: os campos ficam soltos dentro de outro cartão (ex.: dentro da doença em
// tratamento), sem borda própria e sem o título que abre e fecha
function CartaoMedicacao({ med, numero, aberto, aoAlternar, aoMudar, aoRemover, embutida }) {
  function mudar(campo, valor) {
    aoMudar({ ...med, [campo]: valor });
  }

  const resumo = resumoMedicacao(med);

  const classe = embutida
    ? "med-embutida"
    : aberto
      ? "med-cartao med-cartao-aberto"
      : "med-cartao";

  return (
    <div className={classe}>
      {!embutida && (
        <button
          type="button"
          className="med-cartao-titulo"
          onClick={aoAlternar}
          aria-expanded={aberto}
        >
          <span>
            <strong>{nomeComConcentracao(med) || `Medicação ${numero}`}</strong>
            {!aberto && resumo && <span className="med-cartao-resumo">{resumo}</span>}
          </span>
          {aberto ? <IoChevronUp /> : <IoChevronDown />}
        </button>
      )}

      {(aberto || embutida) && (
        <div className="med-cartao-corpo">
          <label>
            <span>
              Nome da medicação <span className="obrigatorio">*</span>
            </span>
            <input
              type="text"
              value={med.nome}
              placeholder="Ex: Apoquel"
              maxLength={60}
              onChange={(evento) => mudar("nome", evento.target.value)}
            />
          </label>

          <div className="med-campo">
            <span className="med-rotulo">Concentração</span>
            <div className="med-linha">
              <input
                type="text"
                inputMode="decimal"
                className="med-numero med-numero-largo"
                value={med.concentracao}
                maxLength={7}
                onChange={(evento) =>
                  // Só números, vírgula e ponto (ex.: 500, 2,5)
                  mudar("concentracao", evento.target.value.replace(/[^\d,.]/g, ""))
                }
              />
              <ListaOpcoes
                opcoes={UNIDADES_CONCENTRACAO}
                valor={med.concentracaoUnidade}
                aoMudar={(valor) => mudar("concentracaoUnidade", valor)}
              />
            </div>
          </div>

          <div className="med-campo">
            <span className="med-rotulo">Dose</span>
            <div className="med-linha">
              <input
                type="text"
                inputMode="decimal"
                className="med-numero med-numero-largo"
                value={med.dose}
                maxLength={6} // aceita "0,25" e "0.25"
                onChange={(evento) => mudar("dose", soDose(evento.target.value))}
              />
              <ListaOpcoes
                opcoes={UNIDADES_DOSE}
                valor={med.unidade}
                aoMudar={(valor) => mudar("unidade", valor)}
              />
            </div>
          </div>

          <div className="med-campo">
            <span className="med-rotulo">Frequência</span>
            <div className="med-linha">
              <input
                type="text"
                inputMode="numeric"
                className="med-numero"
                value={med.vezes}
                maxLength={2}
                onChange={(evento) => mudar("vezes", soNumeros(evento.target.value))}
              />
              <span className="med-texto">
                {Number(med.vezes) === 1 ? "vez" : "vezes"} a cada
              </span>
              <input
                type="text"
                inputMode="numeric"
                className="med-numero"
                value={med.intervalo}
                maxLength={3}
                onChange={(evento) => mudar("intervalo", soNumeros(evento.target.value))}
              />
              <SeletorTempo
                valor={med.intervaloTempo}
                quantidade={med.intervalo}
                aoMudar={(valor) => mudar("intervaloTempo", valor)}
              />
            </div>
          </div>

          {/* Só para as de semana, mês ou ano: é com essa data que o app lembra da próxima */}
          {TEMPOS_COM_LEMBRETE.includes(med.intervaloTempo) && (
            <label>
              Data da última dose
              <CampoData valor={med.ultimaDose} aoMudar={(valor) => mudar("ultimaDose", valor)} />
            </label>
          )}

          <div className="med-campo">
            <span className="med-rotulo">Duração</span>
            <label className="med-check">
              <input
                type="checkbox"
                checked={med.ateNovasRecomendacoes}
                onChange={(evento) =>
                  mudar("ateNovasRecomendacoes", evento.target.checked)
                }
              />
              Até novas recomendações
            </label>
            {!med.ateNovasRecomendacoes && (
              <div className="med-linha">
                <span className="med-texto">durante</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="med-numero"
                  value={med.duracao}
                  maxLength={3}
                  onChange={(evento) => mudar("duracao", soNumeros(evento.target.value))}
                />
                <SeletorTempo
                  valor={med.duracaoTempo}
                  quantidade={med.duracao}
                  aoMudar={(valor) => mudar("duracaoTempo", valor)}
                />
              </div>
            )}
          </div>

          {resumo && <p className="med-resumo">{resumo}</p>}

          <button type="button" className="med-remover" onClick={aoRemover}>
            <IoTrashOutline />
            Remover medicação
          </button>
        </div>
      )}
    </div>
  );
}

// Lista de medicações de uso contínuo: cada uma abre e fecha
// (embutida: sempre aberta, sem cartão próprio — ver CartaoMedicacao)
export default function Medicacoes({ medicacoes, aoMudar, embutida = false }) {
  // Medicações abertas (pelo id). As que já vêm do banco começam fechadas;
  // as que chegam sem nome (ex.: o cartão em branco do "Sim") começam abertas.
  // A função só roda na 1ª vez que a lista aparece na tela.
  const [abertas, setAbertas] = useState(() =>
    Object.fromEntries(medicacoes.filter((med) => !med.nome).map((med) => [med.id, true]))
  );

  function adicionar() {
    const nova = medicacaoVazia();
    aoMudar([...medicacoes, nova]);
    setAbertas({ ...abertas, [nova.id]: true });
  }

  return (
    <div className="med-lista">
      {medicacoes.map((med, indice) => (
        <CartaoMedicacao
          key={med.id}
          med={med}
          numero={indice + 1}
          // Abre e fecha só pelo clique (não depende mais do nome)
          aberto={abertas[med.id] ?? false}
          aoAlternar={() => setAbertas({ ...abertas, [med.id]: !abertas[med.id] })}
          aoMudar={(medAlterada) =>
            aoMudar(medicacoes.map((m) => (m.id === med.id ? medAlterada : m)))
          }
          aoRemover={() => aoMudar(medicacoes.filter((m) => m.id !== med.id))}
          embutida={embutida}
        />
      ))}

      {medicacoes.length < LIMITE_MEDICACOES && (
        <button type="button" className="lista-mais-adicionar" onClick={adicionar}>
          + Adicionar medicação
        </button>
      )}
    </div>
  );
}
