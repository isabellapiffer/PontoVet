import { useState } from "react";
import { IoClose, IoLocateOutline } from "react-icons/io5";
import "./gavetaendereco.css";

// Gaveta que sobe de baixo para trocar o endereço do topo.
// Duas opções: digitar o endereço, ou usar a localização do celular
// (que preenche o campo, e a pessoa ainda pode corrigir antes de confirmar).
export default function GavetaEndereco({ enderecoAtual, aoConfirmar, aoFechar }) {
  const [texto, setTexto] = useState(enderecoAtual || "");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      setErro("Seu navegador não permite usar a localização.");
      return;
    }

    setBuscando(true);
    setErro("");

    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        const { latitude, longitude } = posicao.coords;

        try {
          const resposta = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`
          );
          if (!resposta.ok) throw new Error("Falha ao buscar o endereço");

          const dados = await resposta.json();
          const partes = dados.address || {};

          const rua = partes.road || "";
          const numero = partes.house_number || "";
          const bairro = partes.suburb || partes.neighbourhood || "";
          const cidade = partes.city || partes.town || partes.village || "";

          const ruaComNumero = numero ? `${rua}, ${numero}` : rua;
          const resultado = [ruaComNumero, bairro, cidade]
            .filter(Boolean)
            .join(" - ");
          if (!resultado) throw new Error("Endereço vazio");

          setTexto(resultado);
        } catch {
          setErro("Não foi possível encontrar o seu endereço. Digite no campo.");
        }

        setBuscando(false);
      },
      () => {
        setErro("Não conseguimos acessar a sua localização. Digite no campo.");
        setBuscando(false);
      }
    );
  }

  function confirmar() {
    if (!texto.trim()) {
      setErro("Digite um endereço ou use a sua localização.");
      return;
    }
    aoConfirmar(texto.trim());
  }

  return (
    <div className="gaveta-fundo" onClick={aoFechar}>
      <section
        className="gaveta"
        role="dialog"
        aria-label="Alterar endereço"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="gaveta-alca"></div>

        <div className="gaveta-topo">
          <h2 className="gaveta-titulo">Alterar endereço</h2>
          <button className="gaveta-fechar" aria-label="Fechar" onClick={aoFechar}>
            <IoClose />
          </button>
        </div>

        <button
          className="gaveta-localizacao"
          onClick={usarMinhaLocalizacao}
          disabled={buscando}
        >
          <IoLocateOutline />
          <span>{buscando ? "Buscando sua localização..." : "Usar minha localização"}</span>
        </button>

        <label className="gaveta-campo">
          Endereço
          <input
            type="text"
            value={texto}
            placeholder="Rua, número - bairro - cidade"
            onChange={(evento) => {
              setTexto(evento.target.value);
              setErro("");
            }}
          />
        </label>

        {erro && <p className="gaveta-erro">{erro}</p>}

        <button className="gaveta-confirmar" onClick={confirmar}>
          Confirmar endereço
        </button>
      </section>
    </div>
  );
}
