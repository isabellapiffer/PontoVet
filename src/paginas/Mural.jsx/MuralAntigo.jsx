import { useNavigate, useLocation } from "react-router-dom";
import { CardVet, Buscar } from "./Mural.jsx";
import { vets } from "../../dados.js";

export default function MuralAntigo() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ paddingBottom: "80px" }}>
      <Buscar />
      <div className="lista-cards">
        {vets.map((vet) => (
          <CardVet key={vet.id} vet={vet} />
        ))}
      </div>

      <div className="barra-login">
        <button
          className="botao-login"
          onClick={() =>
            navigate("/login", { state: { voltarPara: location.pathname } })
          }
        >
          Fazer login
        </button>
      </div>
    </div>
  );
}
