import { useNavigate } from "react-router-dom";
import "./Mural.jsx/mural.css";
import "./paginanaoencontrada.css";

// Aparece quando o endereço digitado não existe no app (ex.: /pets)
export default function PaginaNaoEncontrada() {
  const navigate = useNavigate();

  return (
    <div className="nao-encontrada-pagina">
      <i className="fa-solid fa-paw nao-encontrada-icone"></i>

      <h1 className="nao-encontrada-titulo">Página não encontrada</h1>

      <button className="botao-login" onClick={() => navigate("/")}>
        Voltar ao início
      </button>
    </div>
  );
}
