import { useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import "./buscaratendimento.css";

export default function BuscarAtendimento() {
  const navigate = useNavigate();

  return (
    <section className="buscar-atendimento">
      <h2 className="buscar-atendimento-titulo">Precisa de atendimento?</h2>
      <button
        className="buscar-atendimento-campo"
        onClick={() => navigate("/buscar")}
      >
        <IoSearch className="buscar-atendimento-lupa" />
        <span>Buscar veterinário, vacina, exame…</span>
      </button>
    </section>
  );
}
