import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BotaoVoltar from "../componentes/BotaoVoltar.jsx";
import { CardVet, Buscar } from "./Mural.jsx/Mural.jsx";
import { vets } from "../dados.js";
import MenuInferior from "../componentes/MenuInferior.jsx";
import {
  cidadeDoUsuario,
  distanciaKm,
  nomeOficialCidade,
} from "../distancia.js";
import "./telabuscar.css";

// Ordena os veterinários do mais perto ao mais longe de uma cidade.
// Sem cidade (ou fora de SC): deixa a ordem como está
function ordenarPorDistancia(lista, cidade) {
  if (!cidade) return lista;

  return lista
    .map((vet) => {
      const km = distanciaKm(cidade, vet.cidade);
      return { ...vet, km: km === null ? Infinity : km };
    })
    .sort((a, b) => a.km - b.km);
}

// Entre as cidades que TÊM veterinário, qual fica mais perto da cidade buscada
function cidadeMaisProximaComVet(cidadeBuscada) {
  let maisProxima = null;
  let menorKm = Infinity;

  for (const vet of vets) {
    const km = distanciaKm(cidadeBuscada, vet.cidade);
    if (km !== null && km < menorKm) {
      menorKm = km;
      maisProxima = vet.cidade;
    }
  }

  return maisProxima;
}

export default function TelaBuscar() {
  const navigate = useNavigate();

  // Cidade de onde a pessoa está (para ordenar por distância)
  const [cidadeUsuario, setCidadeUsuario] = useState(null);
  // Cidade escolhida no filtro ao clicar em "Buscar" ("" = sem filtro)
  const [cidadeFiltro, setCidadeFiltro] = useState("");
  // Muda a cada "Limpar filtro": faz o painel de busca começar do zero
  const [versaoBusca, setVersaoBusca] = useState(0);

  useEffect(() => {
    cidadeDoUsuario().then(setCidadeUsuario);
  }, []);

  function limparFiltro() {
    setCidadeFiltro("");
    setVersaoBusca((versao) => versao + 1);
  }

  // Decide o que mostrar na lista
  let lista;
  let aviso = "";

  if (!cidadeFiltro) {
    // Sem filtro: todos, do mais perto ao mais longe da pessoa
    lista = ordenarPorDistancia(vets, cidadeUsuario);
  } else {
    const naCidade = vets.filter(
      (vet) => nomeOficialCidade(vet.cidade) === nomeOficialCidade(cidadeFiltro)
    );

    if (naCidade.length > 0) {
      lista = ordenarPorDistancia(naCidade, cidadeUsuario);
    } else {
      // Ninguém na cidade buscada: mostra os da cidade mais próxima dela
      const maisProxima = cidadeMaisProximaComVet(cidadeFiltro);
      aviso = `Não localizamos nenhum veterinário em ${cidadeFiltro}. Veja os da cidade mais próxima: ${maisProxima}.`;
      lista = ordenarPorDistancia(
        vets.filter((vet) => vet.cidade === maisProxima),
        cidadeUsuario
      );
    }
  }

  return (
    <div className="tela-buscar">
      <header className="topo-com-voltar">
        <BotaoVoltar
          descricao="Voltar para a tela inicial"
          aoClicar={() => navigate("/")}
        />
        <h1 className="tela-buscar-titulo">Buscar atendimento</h1>
      </header>

      <Buscar
        key={versaoBusca}
        fixo={true}
        aoBuscar={(filtros) => setCidadeFiltro(filtros.cidade)}
      />

      <section className="tela-buscar-resultados">
        <div className="tela-buscar-resultados-topo">
          <h2 className="tela-buscar-subtitulo">
            {cidadeFiltro ? "Resultado da busca" : "Profissionais perto de você"}
          </h2>
          {cidadeFiltro && (
            <button className="botao-limpar-filtro" onClick={limparFiltro}>
              Limpar filtro
            </button>
          )}
        </div>

        {/* Os profissionais do dados.js são inventados: avisa quem estiver testando */}
        <p className="tela-buscar-aviso-fake">Profissionais e dados fictícios, só para demonstração.</p>

        {aviso && <p className="tela-buscar-aviso">{aviso}</p>}

        <div className="lista-cards">
          {lista.map((vet) => (
            <CardVet key={vet.id} vet={vet} />
          ))}
        </div>
      </section>

      <MenuInferior />
    </div>
  );
}
