import { SelectCostumizado } from "../paginas/Mural.jsx/SelectCostumizado.jsx";
import "./listaopcoes.css";

// Lista para escolher (unidade, tempo...) no lugar do <select> do navegador,
// que em alguns computadores abria com a letra branca. É a mesma lista de Sexo e Castrado.
// opcoes: ["mg", "ml"] ou pares [valor guardado, texto na tela]: [["mes", "meses"]]
export default function ListaOpcoes({ opcoes, valor, aoMudar, placeholder = "Unidade" }) {
  const pares = opcoes.map((opcao) => (Array.isArray(opcao) ? opcao : [opcao, opcao]));
  const textoAtual = pares.find(([guardado]) => guardado === valor)?.[1] || "";

  return (
    <div className="lista-opcoes">
      <SelectCostumizado
        label={placeholder}
        opcoes={pares.map(([, texto]) => texto)}
        valor={textoAtual}
        aoEscolher={(texto) => aoMudar(pares.find(([, t]) => t === texto)[0])}
      />
    </div>
  );
}
