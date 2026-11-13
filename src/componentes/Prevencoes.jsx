import { useState } from "react";
import { IoClose, IoTrashOutline } from "react-icons/io5";
import { UNIDADES_DOSE } from "./Medicacoes.jsx";
import CampoData from "./CampoData.jsx";
import ListaOpcoes from "./ListaOpcoes.jsx";
import { validarData, paraDataISO, deDataISO } from "../formatadores.js";
import "./prevencoes.css";

const LIMITE_REGISTROS = 50;

// Do mais novo para o mais antigo (a data fica guardada como "2026-09-10")
export function ordenarPorData(registros) {
  return [...registros].sort((a, b) => b.data.localeCompare(a.data));
}

// O nome que aparece na lista: o produto ("Drontal"), o nome do exame ("Ultrassom")
// ou, nos testes de FIV/FeLV, o resultado ("Negativo")
function nomeDoRegistro(registro) {
  return registro.produto ?? registro.nome ?? registro.resultado;
}

// "Drontal · 1 comprimido(s)"
export function textoRegistro(registro) {
  const nome = nomeDoRegistro(registro);
  const dose = `${registro.dose || ""} ${registro.unidade || ""}`.trim();
  return dose ? `${nome} · ${dose}` : nome;
}

// Tudo o que foi registrado na data mais recente
// (ex.: V10 e Raiva aplicadas no mesmo dia aparecem juntas)
export function registrosDaUltimaData(registros) {
  if (!registros.length) return [];
  const ultimaData = ordenarPorData(registros)[0].data;
  return registros.filter((registro) => registro.data === ultimaData);
}

// Resumo com o tópico fechado: "Última: Drontal · 10/09/2026"
// (nos exames, rotulo = "Último": "Último: Sangue · 03/11/2026")
export function resumoPrevencao(registros, rotulo = "Última") {
  if (!registros.length) return "Nenhum registrado";
  const ultimos = registrosDaUltimaData(registros);
  const nomes = ultimos.map(nomeDoRegistro);
  return `${rotulo}: ${nomes.join(", ")} · ${deDataISO(ultimos[0].data)}`;
}

// Mini formulário para registrar uma vez (produto, dose e data)
function NovoRegistro({ rotuloProduto, exemploProduto, aoAdicionar, aoCancelar }) {
  const [produto, setProduto] = useState("");
  const [dose, setDose] = useState("");
  const [unidade, setUnidade] = useState("");
  const [data, setData] = useState("");
  const [erro, setErro] = useState("");

  function adicionar() {
    if (!produto.trim()) {
      setErro("Escreva o nome do produto.");
      return;
    }
    const erroData = validarData(data);
    if (erroData) {
      setErro(erroData);
      return;
    }
    if (new Date(paraDataISO(data)) > new Date()) {
      setErro("A data não pode ser no futuro.");
      return;
    }

    aoAdicionar({
      produto: produto.trim(),
      dose,
      unidade,
      data: paraDataISO(data),
      autor: "tutor", // depois o veterinário também vai registrar
    });
  }

  return (
    <div className="prev-novo">
      <label>
        <span>
          {rotuloProduto} <span className="obrigatorio">*</span>
        </span>
        <input
          type="text"
          value={produto}
          placeholder={exemploProduto}
          maxLength={60}
          onChange={(evento) => setProduto(evento.target.value)}
        />
      </label>

      <div className="med-campo">
        <span className="med-rotulo">Dose</span>
        <div className="med-linha">
          <input
            type="text"
            inputMode="decimal"
            className="med-numero med-numero-largo"
            value={dose}
            maxLength={6} // aceita "0,25" e "0.25"
            onChange={(evento) => setDose(evento.target.value.replace(/[^\d,./]/g, ""))}
          />
          <ListaOpcoes opcoes={UNIDADES_DOSE} valor={unidade} aoMudar={setUnidade} />
        </div>
      </div>

      <label>
        <span>
          Data em que foi dado <span className="obrigatorio">*</span>
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

// Gaveta que sobe de baixo com todas as vezes registradas
function HistoricoCompleto({ titulo, registros, aoRemover, aoFechar }) {
  return (
    <div className="prev-fundo" onClick={aoFechar}>
      <section
        className="prev-folha"
        role="dialog"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="prev-alca" />
        <div className="prev-folha-topo">
          <h2>{titulo}</h2>
          <button type="button" className="prev-fechar" aria-label="Fechar" onClick={aoFechar}>
            <IoClose />
          </button>
        </div>

        <ul className="prev-lista">
          {ordenarPorData(registros).map((registro, indice) => (
            <li
              key={`${registro.data}-${registro.produto}-${indice}`}
              className={indice === 0 ? "prev-item prev-item-ultimo" : "prev-item"}
            >
              <div>
                <strong>{textoRegistro(registro)}</strong>
                <span>
                  {deDataISO(registro.data)}
                  {registro.proxima && ` · Próxima: ${deDataISO(registro.proxima)}`} ·
                  Informado pelo tutor
                </span>
                {/* Só nos exames: o local e o resultado */}
                {registro.local && <span className="prev-item-extra">{registro.local}</span>}
                {registro.nome && registro.resultado && (
                  <span className="prev-item-extra">Resultado: {registro.resultado}</span>
                )}
              </div>
              <button
                type="button"
                className="lista-mais-remover"
                aria-label="Remover registro"
                onClick={() => aoRemover(registro)}
              >
                <IoTrashOutline />
              </button>
            </li>
          ))}
        </ul>
        <p className="prev-dica">Do mais novo para o mais antigo.</p>
      </section>
    </div>
  );
}

// Vermifugação ou Antiparasitário: mostra a última vez, registra uma nova
// e abre o histórico completo
export default function Prevencoes({
  registros,
  aoMudar,
  nome, // "vermifugação"
  rotuloProduto, // "Qual vermífugo?"
  exemploProduto, // "Ex: Drontal"
  FormularioNovo, // outro formulário de registro (ex.: RegistrarVacinas)
  propsFormulario, // informações extras para esse formulário (ex.: a espécie)
}) {
  const [registrando, setRegistrando] = useState(false);
  const [vendoHistorico, setVendoHistorico] = useState(false);

  const ultimos = registrosDaUltimaData(registros);

  function adicionar(novos) {
    // O formulário das vacinas devolve várias de uma vez
    aoMudar([...registros, ...(Array.isArray(novos) ? novos : [novos])]);
    setRegistrando(false);
  }

  return (
    <div className="prev">
      {ultimos.length > 0 && (
        <div className="prev-ultima">
          <small>Última vez · {deDataISO(ultimos[0].data)}</small>
          {ultimos.map((registro, indice) => (
            <p key={indice}>
              <strong>{textoRegistro(registro)}</strong>
              {registro.proxima && <span>Próxima: {deDataISO(registro.proxima)}</span>}
            </p>
          ))}
        </div>
      )}

      {registrando && FormularioNovo && (
        <FormularioNovo
          {...propsFormulario}
          aoAdicionar={adicionar}
          aoCancelar={() => setRegistrando(false)}
        />
      )}
      {registrando && !FormularioNovo && (
        <NovoRegistro
          rotuloProduto={rotuloProduto}
          exemploProduto={exemploProduto}
          aoCancelar={() => setRegistrando(false)}
          aoAdicionar={adicionar}
        />
      )}
      {!registrando && (
        <div className="prev-acoes">
          {registros.length < LIMITE_REGISTROS && (
            <button
              type="button"
              className="lista-mais-adicionar"
              onClick={() => setRegistrando(true)}
            >
              + Registrar {nome}
            </button>
          )}
          {registros.length > 0 && (
            <button
              type="button"
              className="lista-mais-adicionar"
              onClick={() => setVendoHistorico(true)}
            >
              Ver histórico ({registros.length}) ›
            </button>
          )}
        </div>
      )}

      {vendoHistorico && (
        <HistoricoCompleto
          titulo={`Histórico de ${nome}`}
          registros={registros}
          aoFechar={() => setVendoHistorico(false)}
          aoRemover={(registro) => {
            const restantes = registros.filter((r) => r !== registro);
            aoMudar(restantes);
            if (!restantes.length) setVendoHistorico(false);
          }}
        />
      )}
    </div>
  );
}
