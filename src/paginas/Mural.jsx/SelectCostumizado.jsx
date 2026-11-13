import { useState, useRef, useEffect } from "react";
import { semAcento } from "../../texto.js";

// "invalido" = true deixa a borda vermelha (campo obrigatório vazio)
export function SelectCostumizado({ label, opcoes, aoEscolher, valor, invalido }) {
  const [aberto, setAberto] = useState(false);
  const [selecionado, setSelecionado] = useState(valor || "");
  const [digitado, setDigitado] = useState("");
  const [valorAnterior, setValorAnterior] = useState(valor);
  const [indiceDestaque, setIndiceDestaque] = useState(-1);
  const caixaRef = useRef(null);
  const opcoesRefs = useRef([]);

  if (valor !== undefined && valor !== valorAnterior) {
    setValorAnterior(valor);
    setSelecionado(valor);
  }

  const opcoesFiltradas = aberto
    ? opcoes.filter((opcao) => semAcento(opcao).startsWith(semAcento(digitado)))
    : opcoes;

  function escolher(opcao) {
    setSelecionado(opcao);
    setDigitado("");
    setAberto(false);
    setIndiceDestaque(-1);
    if (aoEscolher) {
      aoEscolher(opcao);
    }
  }

  function abrirLista() {
    setAberto(true);
    setDigitado("");
    setIndiceDestaque(-1);
  }

  function fecharSemEscolher() {
    setDigitado("");
    setAberto(false);
    setIndiceDestaque(-1);
  }

  useEffect(() => {
    function aoClicarFora(evento) {
      if (caixaRef.current && !caixaRef.current.contains(evento.target)) {
        fecharSemEscolher();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, []);

  useEffect(() => {
    if (indiceDestaque >= 0 && opcoesRefs.current[indiceDestaque]) {
      opcoesRefs.current[indiceDestaque].scrollIntoView({ block: "nearest" });
    }
  }, [indiceDestaque]);

  return (
    <div className="select-custom" ref={caixaRef}>
      <input
        type="text"
        className={invalido ? "select-caixa campo-invalido" : "select-caixa"}
        placeholder={label}
        value={aberto ? digitado : selecionado}
        onFocus={abrirLista}
        onClick={abrirLista}
        onChange={(evento) => {
          setDigitado(evento.target.value);
          setIndiceDestaque(-1);
        }}
        onBlur={fecharSemEscolher}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault();
            // Ordem: a opção destacada pelas setas; a que é igual ao que foi
            // digitado (ex.: "Não", mesmo existindo "Não definido"); senão, a 1ª da lista
            const igual = opcoesFiltradas.find(
              (opcao) => semAcento(opcao) === semAcento(digitado)
            );
            if (indiceDestaque >= 0 && opcoesFiltradas[indiceDestaque]) {
              escolher(opcoesFiltradas[indiceDestaque]);
            } else if (igual) {
              escolher(igual);
            } else if (digitado && opcoesFiltradas.length) {
              escolher(opcoesFiltradas[0]);
            }
          }
          if (evento.key === "Escape") {
            fecharSemEscolher();
          }
          if (evento.key === "ArrowDown") {
            evento.preventDefault();
            setAberto(true);
            setIndiceDestaque((indiceAtual) =>
              Math.min(indiceAtual + 1, opcoesFiltradas.length - 1)
            );
          }
          if (evento.key === "ArrowUp") {
            evento.preventDefault();
            setIndiceDestaque((indiceAtual) => Math.max(indiceAtual - 1, 0));
          }
        }}
      />

      {aberto && (
        <div className="select-opcoes">
          {opcoesFiltradas.map((opcao, indice) => (
            <p
              key={opcao}
              ref={(el) => (opcoesRefs.current[indice] = el)}
              className={indice === indiceDestaque ? "select-destaque" : ""}
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolher(opcao);
              }}
            >
              {opcao}
            </p>
          ))}

          {opcoesFiltradas.length === 0 && (
            <p className="select-sem-opcoes">Nenhuma opção encontrada</p>
          )}
        </div>
      )}
    </div>
  );
}
