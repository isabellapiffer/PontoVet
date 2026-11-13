import { useNavigate } from "react-router-dom";
import { IoCalendarOutline } from "react-icons/io5";
import { quandoEOnde } from "../lembretes.js";
import "./proximosagendamentos.css";

// agendamentos: os itens de proximosDaTelaInicial (compromissos e lembretes).
// Ex.: "Consulta · Hanna" / "11/11 às 15:00 · Dra Ana"
export default function ProximosAgendamentos({ agendamentos = [] }) {
  const navigate = useNavigate();

  return (
    <section className="agendamentos">
      <div className="agendamentos-topo">
        <h2 className="agendamentos-titulo">Próximos agendamentos</h2>
        <button
          className="agendamentos-botao-agenda"
          onClick={() => navigate("/agenda")}
        >
          Agenda
        </button>
      </div>

      {agendamentos.length === 0 ? (
        <p className="agendamentos-vazio">Nenhum agendamento por enquanto</p>
      ) : (
        <div className="agendamentos-lista">
          {agendamentos.map((agendamento) => (
            <button
              key={agendamento.id}
              className="agendamentos-item"
              onClick={() => navigate("/agenda")}
            >
              <div className="agendamentos-icone">
                <IoCalendarOutline />
              </div>
              <div className="agendamentos-textos">
                <span className="agendamentos-linha-1">
                  {agendamento.titulo} · {agendamento.pet.nome}
                </span>
                <span className="agendamentos-linha-2">{quandoEOnde(agendamento)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
