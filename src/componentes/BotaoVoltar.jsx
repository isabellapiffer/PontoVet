import { IoArrowBack } from "react-icons/io5";
import "./botaovoltar.css";

// A seta de voltar usada em todas as telas.
// aoClicar: o que acontece ao clicar (cada tela decide para onde volta).
export default function BotaoVoltar({ aoClicar, descricao = "Voltar" }) {
  return (
    <button className="botao-seta-voltar" aria-label={descricao} onClick={aoClicar}>
      <IoArrowBack />
    </button>
  );
}
