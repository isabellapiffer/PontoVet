import "./splash.css";

export default function Splash() {
  return (
    <div className="splash-pagina">
      <img src="/logopontovet.png" alt="PontoVet" className="splash-logo" />

      <div className="splash-faixa">
        <div className="splash-item">
          <i className="fa-solid fa-briefcase"></i>
          <span>
            Vagas para
            <br />
            veterinários
          </span>
        </div>

        <div className="splash-divisor"></div>

        <div className="splash-item">
          <i className="fa-solid fa-paw"></i>
          <span>
            Atendimento
            <br />
            domiciliar
          </span>
        </div>

        <div className="splash-divisor"></div>

        <div className="splash-item">
          <i className="fa-solid fa-hospital"></i>
          <span>
            Clínicas e
            <br />
            hospitais
          </span>
        </div>
      </div>

      <div className="splash-pontos">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
