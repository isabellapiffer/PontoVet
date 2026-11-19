import { useState } from "react";
import CampoData from "./CampoData.jsx";
import { validarData, paraDataISO, deDataISO } from "../formatadores.js";
import { hojeISO, somarIntervalo } from "../lembretes.js";
import {
  VACINAS_POR_ESPECIE,
  VACINAS_OUTRAS_ESPECIES,
  nomeDaVacina,
  alternarVacina,
} from "../vacinas.js";
import "./vacinas.css";

// Em quanto tempo é a próxima aplicação: [texto do botão, quantidade, tempo]
const PROXIMAS = [
  ["14 dias", 14, "dia"],
  ["21 dias", 21, "dia"],
  ["1 ano", 1, "ano"],
];

// Data da próxima aplicação calculada pelo app ("2026-11-14"), ou "" se ainda não dá
function calcularProxima(dataAplicacao, escolha) {
  const opcao = PROXIMAS.find(([texto]) => texto === escolha);
  if (!opcao || validarData(dataAplicacao)) return "";
  return somarIntervalo(paraDataISO(dataAplicacao), opcao[1], opcao[2]);
}

// Mini formulário para registrar uma ou mais vacinas de uma vez.
// Cada vacina marcada tem a própria data de aplicação e a próxima aplicação.
// iniciais: vacinas que já vêm marcadas, pelo nome do banco (ex.: ["V10", "Raiva"]);
// dataInicial: "18/11/2026" para todas elas (usado no "Registrar aplicação" da Agenda)
export default function RegistrarVacinas({
  especie,
  aoAdicionar,
  aoCancelar,
  iniciais = [],
  dataInicial = "",
}) {
  const opcoes = VACINAS_POR_ESPECIE[especie] || VACINAS_OUTRAS_ESPECIES;
  // "V10" -> "V10 (polivalente)" (o botão da lista)
  const marcadasIniciais = opcoes.filter((opcao) => iniciais.includes(nomeDaVacina(opcao)));

  const [marcadas, setMarcadas] = useState(marcadasIniciais);
  // datas[opcao] = { data, proxima ("14 dias", "21 dias" ou "1 ano"), repetir }
  const [datas, setDatas] = useState(
    Object.fromEntries(marcadasIniciais.map((opcao) => [opcao, { data: dataInicial }]))
  );
  const [erro, setErro] = useState("");

  function mudarData(opcao, campo, valor) {
    setDatas({ ...datas, [opcao]: { ...datas[opcao], [campo]: valor } });
  }

  // Data de aplicação de cada vacina, seguindo o "repetir a da anterior"
  function dataDeAplicacao(indice) {
    const opcao = marcadas[indice];
    if (indice > 0 && datas[opcao]?.repetir) return dataDeAplicacao(indice - 1);
    return datas[opcao]?.data || "";
  }

  function adicionar() {
    if (!marcadas.length) {
      setErro("Marque pelo menos uma vacina.");
      return;
    }

    const novas = [];
    for (const [indice, opcao] of marcadas.entries()) {
      const nome = nomeDaVacina(opcao);
      const data = dataDeAplicacao(indice);
      const proxima = datas[opcao]?.proxima || "";

      const erroData = validarData(data);
      if (erroData) {
        setErro(`${nome}: data da aplicação. ${erroData}`);
        return;
      }
      if (paraDataISO(data) > hojeISO()) {
        setErro(`${nome}: a data da aplicação não pode ser no futuro.`);
        return;
      }
      if (!proxima) {
        setErro(`${nome}: escolha quando é a próxima aplicação.`);
        return;
      }

      novas.push({
        produto: nome,
        data: paraDataISO(data),
        proxima: calcularProxima(data, proxima),
        autor: "tutor", // depois o veterinário também vai registrar
      });
    }

    aoAdicionar(novas);
  }

  if (!especie) {
    return (
      <div className="prev-novo">
        <p className="topico-dica">Escolha a espécie em Dados do animal para ver as vacinas.</p>
        <button type="button" className="prev-cancelar" onClick={aoCancelar}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="prev-novo">
      <div className="med-campo">
        <span className="med-rotulo">
          Quais vacinas? <span className="obrigatorio">*</span>
        </span>
        <div className="vacinas-opcoes">
          {opcoes.map((opcao) => (
            <button
              key={opcao}
              type="button"
              className={
                marcadas.includes(opcao)
                  ? "sim-nao-opcao sim-nao-ativo"
                  : "sim-nao-opcao"
              }
              onClick={() => setMarcadas(alternarVacina(marcadas, opcao, especie))}
            >
              {opcao}
            </button>
          ))}
        </div>
      </div>

      {marcadas.map((opcao, indice) => {
        const repetir = indice > 0 && datas[opcao]?.repetir;
        return (
          <div key={opcao} className="vacinas-bloco">
            <strong>{nomeDaVacina(opcao)}</strong>

            {indice > 0 && (
              <label className="med-check">
                <input
                  type="checkbox"
                  checked={Boolean(repetir)}
                  onChange={(evento) => mudarData(opcao, "repetir", evento.target.checked)}
                />
                Repetir a data de aplicação da vacina anterior
              </label>
            )}

            <label>
              <span>
                Data da aplicação <span className="obrigatorio">*</span>
              </span>
              <CampoData
                valor={repetir ? dataDeAplicacao(indice) : datas[opcao]?.data || ""}
                disabled={repetir}
                aoMudar={(valor) => mudarData(opcao, "data", valor)}
              />
            </label>

            <div className="med-campo">
              <span className="med-rotulo">
                Próxima aplicação em <span className="obrigatorio">*</span>
              </span>
              <div className="sim-nao">
                {PROXIMAS.map(([texto]) => (
                  <button
                    key={texto}
                    type="button"
                    className={
                      datas[opcao]?.proxima === texto
                        ? "sim-nao-opcao sim-nao-ativo"
                        : "sim-nao-opcao"
                    }
                    onClick={() => mudarData(opcao, "proxima", texto)}
                  >
                    {texto}
                  </button>
                ))}
              </div>
              {calcularProxima(dataDeAplicacao(indice), datas[opcao]?.proxima) && (
                <span className="vacinas-proxima">
                  Próxima aplicação:{" "}
                  {deDataISO(
                    calcularProxima(dataDeAplicacao(indice), datas[opcao]?.proxima)
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}

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
