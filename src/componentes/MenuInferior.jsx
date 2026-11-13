import { useNavigate, useLocation } from "react-router-dom";
import {
  IoHome,
  IoHomeOutline,
  IoPaw,
  IoPawOutline,
  IoSearch,
  IoSearchOutline,
  IoCalendar,
  IoCalendarOutline,
} from "react-icons/io5";
import "./menuinferior.css";

export default function MenuInferior() {
  const navigate = useNavigate();
  const location = useLocation();
  const telaAberta = location.pathname;
  // O perfil de um pet (/pet/123) faz parte da área Animais
  const naAreaAnimais =
    telaAberta === "/meus-animais" || telaAberta.startsWith("/pet/");

  return (
    <nav className="menu-inferior">
      <button
        className={telaAberta === "/" ? "menu-item menu-item-ativo" : "menu-item"}
        onClick={() => navigate("/")}
      >
        {telaAberta === "/" ? (
          <IoHome className="menu-icon" />
        ) : (
          <IoHomeOutline className="menu-icon" />
        )}
        <span>Início</span>
      </button>
      <button
        className={naAreaAnimais ? "menu-item menu-item-ativo" : "menu-item"}
        onClick={() => navigate("/meus-animais")}
      >
        {naAreaAnimais ? (
          <IoPaw className="menu-icon" />
        ) : (
          <IoPawOutline className="menu-icon" />
        )}
        <span>Animais</span>
      </button>
      <button
        className={telaAberta === "/buscar" ? "menu-item menu-item-ativo" : "menu-item"}
        onClick={() => navigate("/buscar")}
      >
        {telaAberta === "/buscar" ? (
          <IoSearch className="menu-icon" />
        ) : (
          <IoSearchOutline className="menu-icon" />
        )}
        <span>Buscar</span>
      </button>
      <button
        className={telaAberta === "/agenda" ? "menu-item menu-item-ativo" : "menu-item"}
        onClick={() => navigate("/agenda")}
      >
        {telaAberta === "/agenda" ? (
          <IoCalendar className="menu-icon" />
        ) : (
          <IoCalendarOutline className="menu-icon" />
        )}
        <span>Agenda</span>
      </button>
    </nav>
  );
}
