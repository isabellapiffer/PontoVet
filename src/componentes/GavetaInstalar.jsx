import { IoClose, IoShareOutline } from "react-icons/io5";
import "./gavetaendereco.css";
import "./gavetainstalar.css";

// Gaveta que sobe de baixo com a dica de instalar no iPhone.
// Usa o mesmo visual da gaveta de endereço (gavetaendereco.css).
export default function GavetaInstalar({ aoFechar }) {
  return (
    <div className="gaveta-fundo" onClick={aoFechar}>
      <section
        className="gaveta"
        role="dialog"
        aria-label="Use o PontoVet como aplicativo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="gaveta-alca"></div>

        <div className="gaveta-topo">
          <h2 className="gaveta-titulo">Use o PontoVet como aplicativo</h2>
          <button className="gaveta-fechar" aria-label="Fechar" onClick={aoFechar}>
            <IoClose />
          </button>
        </div>

        <ol className="gaveta-instalar-passos">
          <li>
            Toque em <IoShareOutline className="gaveta-instalar-icone" aria-label="Compartilhar" /> no Safari
          </li>
          <li>Escolha "Adicionar à Tela de Início"</li>
        </ol>

        <button className="gaveta-confirmar" onClick={aoFechar}>
          Entendi
        </button>
      </section>
    </div>
  );
}
