import { formatarData, deDataISO } from "../formatadores.js";
import { hojeISO } from "../lembretes.js";
import "./campodata.css";

// Campo de data (DD/MM/AAAA) com o botão "Data atual" ao lado, que preenche
// com o dia de hoje. Usado nas datas de vacina, medicação, vermífugo,
// antiparasitário e teste de FIV/FeLV.
// valor: "10/09/2026" (como aparece na tela); aoMudar(valor): recebe o novo texto
// permitirFuturo: só nos campos de agendar. Sem ele, o ano não passa do ano atual.
export default function CampoData({ valor, aoMudar, disabled = false, permitirFuturo = false }) {
  return (
    <div className="campo-data">
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        value={valor}
        disabled={disabled}
        // Trava o ano, menos quando permitirFuturo (para agendar no ano que vem).
        onChange={(evento) => aoMudar(formatarData(evento.target.value, !permitirFuturo))}
      />
      <button
        type="button"
        className="campo-data-hoje"
        disabled={disabled}
        onClick={() => aoMudar(deDataISO(hojeISO()))}
      >
        Data atual
      </button>
    </div>
  );
}
