import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import "./gaveta.css";

// Bloco que abre e fecha ao clicar no título.
// Quem usa decide se está aberta (aberta) e o que fazer ao clicar (aoAlternar).
export default function Gaveta({ titulo, aberta, aoAlternar, children }) {
  return (
    <section className={aberta ? "secao-gaveta secao-gaveta-aberta" : "secao-gaveta"}>
      <button
        type="button"
        className="secao-gaveta-titulo"
        onClick={aoAlternar}
        aria-expanded={aberta}
      >
        {titulo}
        {aberta ? <IoChevronUp /> : <IoChevronDown />}
      </button>

      {aberta && <div className="secao-gaveta-corpo">{children}</div>}
    </section>
  );
}
