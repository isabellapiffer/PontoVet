import { imagemPadraoPorEspecie } from "../dadosPets.js";
import "./adicionarnaagenda.css";

// Peças repetidas nos formulários do "+" da Agenda (vacina, remédio, consulta,
// exame e outros). Ficam aqui para cada formulário não ter a sua cópia.

function FotoPet({ pet, ativa }) {
  const foto = pet.foto_url || imagemPadraoPorEspecie[pet.especie];
  const classe = ativa ? "add-pet-foto add-pet-foto-ativa" : "add-pet-foto";
  if (foto) return <img src={foto} alt="" className={classe} />;
  return (
    <span className={`${classe} add-pet-foto-vazia`}>
      <i className="fa-solid fa-paw"></i>
    </span>
  );
}

// "Para qual pet?": foto com o nome embaixo; o escolhido fica com a borda roxa
export function EscolherPet({ pets, petId, aoEscolher }) {
  return (
    <div className="add-campo">
      <span className="add-rotulo">
        Para qual pet? <span className="obrigatorio">*</span>
      </span>
      <div className="add-pets">
        {pets.map((p) => (
          <button
            key={p.id}
            type="button"
            className="add-pet"
            aria-pressed={petId === p.id}
            onClick={() => aoEscolher(p.id)}
          >
            <FotoPet pet={p} ativa={petId === p.id} />
            <span className={petId === p.id ? "add-pet-nome add-pet-nome-ativo" : "add-pet-nome"}>
              {p.nome}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Duas opções lado a lado, uma ligada (ex.: "Registrar exame" / "Agendar exame").
// opcoes: [["registrar", "Registrar exame"], ["agendar", "Agendar exame"]]
export function Alternador({ opcoes, valor, aoMudar, rotulo }) {
  return (
    <div className="add-modo" role="group" aria-label={rotulo}>
      {opcoes.map(([opcao, texto]) => (
        <button
          key={opcao}
          type="button"
          aria-pressed={valor === opcao}
          className={valor === opcao ? "add-modo-opcao add-modo-ativo" : "add-modo-opcao"}
          onClick={() => aoMudar(opcao)}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}

// Botões redondos para escolher UMA opção (ex.: os tipos de exame).
// opcoes: lista de textos ou de pares [valor, texto]
export function Escolhas({ opcoes, valor, aoEscolher }) {
  return (
    <div className="add-vacinas">
      {opcoes.map((opcao) => {
        const [chave, texto] = Array.isArray(opcao) ? opcao : [opcao, opcao];
        return (
          <button
            key={chave}
            type="button"
            aria-pressed={valor === chave}
            className={valor === chave ? "add-vacina add-vacina-ativa" : "add-vacina"}
            onClick={() => aoEscolher(chave)}
          >
            {texto}
          </button>
        );
      })}
    </div>
  );
}

// A tela do formulário, por cima da Agenda: topo com a seta de voltar e o título,
// o conteúdo (children) e, embaixo, o rodapé fixo com o botão de salvar
export default function TelaAdicionar({ titulo, aoVoltar, rodape, children }) {
  return (
    <div className="add-tela" role="dialog" aria-label={titulo}>
      <div className="add-conteudo">
        <header className="add-topo">
          <button className="add-voltar" aria-label="Voltar" onClick={aoVoltar}>
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <h1 className="add-titulo">{titulo}</h1>
        </header>

        {children}
      </div>

      {rodape && <div className="add-rodape">{rodape}</div>}
    </div>
  );
}
