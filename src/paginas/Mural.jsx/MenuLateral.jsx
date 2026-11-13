import { useState, useRef, useEffect } from "react";

export function MenuLateral() {
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function aoClicarFora(evento) {
      if (menuRef.current && !menuRef.current.contains(evento.target)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, []);

  return (
    <>
      <div className="icone-menu" onClick={() => setAberto(true)}>
        <div></div>
        <div></div>
        <div></div>
      </div>

      {aberto && (
        <div className="menu-fundo">
          <div className="menu-lateral" ref={menuRef}>
            <div className="menu-topo">
              <span>PontoVet</span>
              <i
                className="fa-solid fa-xmark"
                onClick={() => setAberto(false)}
              ></i>
            </div>

            <div
              className="menu-item"
              onClick={() => setAberto(false)}
            >
              <i className="fa-solid fa-magnifying-glass"></i> Encontrar
              Veterinário
            </div>
            <div
              className="menu-item"
              onClick={() => setAberto(false)}
            >
              <i className="fa-solid fa-user"></i> Cadastrar-se
            </div>
          </div>
        </div>
      )}
    </>
  );
}
