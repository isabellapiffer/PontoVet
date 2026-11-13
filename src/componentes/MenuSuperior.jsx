import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoPerson,
  IoLocationSharp,
  IoChevronDown,
  IoMenu,
  IoPersonOutline,
  IoSettingsOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { supabase } from "../supabaseClient.js";
import GavetaEndereco from "./GavetaEndereco.jsx";
import "./menusuperior.css";

export default function MenuSuperior({ nome, endereco, foto }) {
  const navigate = useNavigate();
  const [enderecoEscolhido, setEnderecoEscolhido] = useState(() => {
    try {
      return sessionStorage.getItem("enderecoEscolhido") || "";
    } catch {
      return "";
    }
  });
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function aoClicarFora(evento) {
      if (menuRef.current && !menuRef.current.contains(evento.target)) {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, []);

  async function sairDaConta() {
    try {
      sessionStorage.removeItem("enderecoEscolhido");
    } catch {
      // nada a limpar
    }
    await supabase.auth.signOut();
    navigate("/login");
  }

  // Endereço escolhido na gaveta. Fica guardado só enquanto a aba do
  // navegador estiver aberta (sessionStorage), não vai para o cadastro.
  function confirmarEndereco(texto) {
    setEnderecoEscolhido(texto);
    try {
      sessionStorage.setItem("enderecoEscolhido", texto);
    } catch {
      // Navegador sem sessionStorage: o endereço vale só até trocar de tela
    }
    setGavetaAberta(false);
  }

  const textoEndereco = enderecoEscolhido || endereco || "Escolher endereço";

  return (
    <header className="menu-superior">
      <button
        className="menu-superior-foto"
        aria-label="Abrir meu perfil"
        onClick={() => navigate("/meu-perfil")}
      >
        {foto ? <img src={foto} alt="" className="menu-superior-foto-imagem" /> : <IoPerson />}
      </button>

      <div className="menu-superior-textos">
        <h1 className="menu-superior-ola">{nome ? `Olá, ${nome}!` : "Olá!"}</h1>

        <button
          className="menu-superior-endereco"
          onClick={() => setGavetaAberta(true)}
        >
          <IoLocationSharp className="menu-superior-pino" />
          <span>{textoEndereco}</span>
          <IoChevronDown />
        </button>
      </div>

      <div className="menu-superior-sanduiche-area" ref={menuRef}>
        <button
          className="menu-superior-sanduiche"
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <IoMenu />
        </button>

        {menuAberto && (
          <div className="menu-superior-opcoes">
            <button
              className="menu-superior-opcao"
              onClick={() => navigate("/meu-perfil")}
            >
              <IoPersonOutline />
              <span>Meu perfil</span>
            </button>
            <button className="menu-superior-opcao">
              <IoSettingsOutline />
              <span>Configurações</span>
            </button>
            <button
              className="menu-superior-opcao menu-superior-sair"
              onClick={sairDaConta}
            >
              <IoLogOutOutline />
              <span>Sair da conta</span>
            </button>
          </div>
        )}
      </div>

      {gavetaAberta && (
        <GavetaEndereco
          enderecoAtual={textoEndereco === "Escolher endereço" ? "" : textoEndereco}
          aoConfirmar={confirmarEndereco}
          aoFechar={() => setGavetaAberta(false)}
        />
      )}
    </header>
  );
}
