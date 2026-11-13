import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./mural.css";
import { SelectCostumizado } from "./SelectCostumizado.jsx";
import { ModalDuvidas } from "./ModalDuvidas.jsx";
import { formatarNota } from "../../nota.js";
import { cidadesSC } from "../../cidadesSC.js";

const paises = [
  "Brasil",
  "Portugal",
  "Estados Unidos",
  "Canadá",
  "México",
  "Argentina",
  "Uruguai",
  "Paraguai",
  "Chile",
  "Bolívia",
  "Peru",
  "Colômbia",
  "Equador",
  "Venezuela",
  "Espanha",
  "França",
  "Itália",
  "Alemanha",
  "Reino Unido",
  "Irlanda",
  "Holanda",
  "Bélgica",
  "Suíça",
  "Áustria",
  "Suécia",
  "Noruega",
  "Dinamarca",
  "Finlândia",
  "Polônia",
  "Grécia",
  "Japão",
  "China",
  "Coreia do Sul",
  "Austrália",
  "Nova Zelândia",
  "África do Sul",
  "Emirados Árabes Unidos",
  "Outro",
];

// usado no modal de perfil do veterinário (ainda não implementado)
// eslint-disable-next-line no-unused-vars
const iconesEspecies = {
  "cão": "/especies/cao.png",
  "gato": "/especies/gato.png",
  "bovino/pequeno ruminante": "/especies/boi.png",
  "cavalo": "/especies/equino.png",
  "aves": "/especies/ave.png",
};

// Quadradinho da nota: roxo com o número, ou lilás com "Novo"
export function SeloNota({ nota, grande = false }) {
  let classe = nota ? "selo-nota" : "selo-nota selo-nota-novo";
  if (grande) classe += " selo-nota-grande";

  return <span className={classe}>{formatarNota(nota)}</span>;
}

// Card deitado da lista: foto, nome, especialidade, cidade e a nota
export function CardVet({ vet }) {
  return (
    <Link to={`/profissional/${vet.id}`} className="card-vet">
      <img src={vet.foto} alt={vet.nome} className="card-vet-foto" />

      <div className="card-vet-textos">
        <h3 className="card-vet-nome">{vet.nome}</h3>
        <span className="etiqueta-especialidade">{vet.especialidade}</span>
        {/* Só a cidade onde o veterinário atende (a lista já vem
            ordenada do mais perto ao mais longe) */}
        <span className="card-vet-local">{vet.cidade}</span>
      </div>

      <SeloNota nota={vet.nota} />
    </Link>
  );
}

export function Banner() {
  return (
    <section className="banner">
      <img src="/banner.png" alt="PontoVet - Encontre o veterinário certo para o seu pet" />
    </section>
  );
}

const TODAS_AS_CIDADES = "Todas as cidades";

// Opções do campo de cidade: "Todas as cidades" + as 295 cidades de SC
const opcoesCidade = [TODAS_AS_CIDADES, ...cidadesSC];

// fixo = true: o painel fica sempre aberto (usado na tela Buscar atendimento)
// aoBuscar: função chamada ao clicar em "Buscar", recebe { cidade }
// (cidade vazia = todas as cidades)
export function Buscar({ fixo = false, aoBuscar }) {
  const [cidade, setCidade] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [painelAberto, setPainelAberto] = useState(fixo);
  const [servico, setServico] = useState("");
  const [temRequisicao, setTemRequisicao] = useState("");
  const [motivoAtestado, setMotivoAtestado] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const painelRef = useRef(null);

  // Vacina, Medicações/Cuidados e atestado para Viagem: a especialidade já vem
  // "Clínico Geral". Se a pessoa troca para outro, a especialidade fica vazia
  // para ela escolher (só se antes estava num desses; senão, não mexe)
  const servicosClinicoGeral = ["Vacina", "Medicações/Cuidados"];

  function escolherServico(valor) {
    const eraClinicoGeral =
      servicosClinicoGeral.includes(servico) ||
      (servico === "Atestado de saúde" && motivoAtestado === "Viagem");

    setServico(valor);

    if (servicosClinicoGeral.includes(valor)) {
      setEspecialidade("Clínico Geral");
    } else if (eraClinicoGeral) {
      setEspecialidade("");
    }
  }

  function escolherMotivoAtestado(valor) {
    setMotivoAtestado(valor);

    if (valor === "Viagem") {
      setEspecialidade("Clínico Geral");
    } else if (motivoAtestado === "Viagem") {
      setEspecialidade("");
    }
  }

  useEffect(() => {
    if (fixo) return;

    function aoClicarFora(evento) {
      if (painelRef.current && !painelRef.current.contains(evento.target)) {
        setPainelAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, [fixo]);

  return (
    <div className="buscar-barra">
      {!painelAberto && (
        <button
          className="botao-refinar"
          onClick={() => setPainelAberto(true)}
        >
          <i className="fa-solid fa-magnifying-glass"></i> Encontrar
          Veterinário
        </button>
      )}

      {painelAberto && (
        <div className="painel-busca" ref={painelRef}>
          {!fixo && (
            <div className="painel-topo">
              <i
                className="fa-solid fa-xmark"
                onClick={() => setPainelAberto(false)}
              ></i>
            </div>
          )}

          <label>
              Busque por cidade
              {/* Só aceita cidades da lista: ignora acento e maiúscula ao
                  digitar, e erro de digitação não passa ("Nenhuma opção") */}
              <SelectCostumizado
                label="Escolha a cidade"
                opcoes={opcoesCidade}
                valor={cidade}
                aoEscolher={setCidade}
              />
            </label>
            <label>
              {" "}
              Qual espécie do seu animal?
              <SelectCostumizado
                label="Todas as Espécies"
                opcoes={[
                  "Gato",
                  "Cachorro",
                  "Aves",
                  "Bovinos",
                  "Equinos",
                  "Silvestres",
                  "Outros",
                ]}
              />
            </label>
            <label>
              O que está acontecendo?
              <SelectCostumizado
                label="Selecione o serviço"
                opcoes={[
                  "Consulta",
                  "Vacina",
                  "Exames",
                  "Medicações/Cuidados",
                  "Atestado de saúde",
                ]}
                aoEscolher={escolherServico}
              />
            </label>

            {servico === "Vacina" && (
              <label>
                Anexar carteirinha de vacinação (opcional)
                <input type="file" accept="image/*" />
              </label>
            )}

            {servico === "Exames" && (
              <>
                <label>
                  Você já tem a requisição de um veterinário?
                  <SelectCostumizado
                    label="Selecione"
                    opcoes={["Sim", "Não"]}
                    aoEscolher={(valor) => setTemRequisicao(valor)}
                  />
                </label>

                {temRequisicao === "Sim" && (
                  <label>
                    Anexar requisição
                    <input type="file" accept="image/*,.pdf" />
                  </label>
                )}

                {temRequisicao === "Não" && (
                  <p className="aviso-campo">
                    É necessário requisição veterinária para coleta de
                    exames a domicílio — se você ainda não tem, é indicado
                    agendar uma consulta primeiro.
                  </p>
                )}
              </>
            )}

            {servico === "Medicações/Cuidados" && (
              <label>
                Qual cuidado seu pet precisa?
                <input
                  type="text"
                  placeholder="Ex: aplicar medicação, trocar curativo, aferir pressão"
                />
              </label>
            )}

            {servico === "Atestado de saúde" && (
              <>
                <label>
                  Para que é o atestado?
                  <SelectCostumizado
                    label="Selecione"
                    opcoes={["Viagem", "Embarque", "Hospedagem", "Outro"]}
                    aoEscolher={escolherMotivoAtestado}
                  />
                </label>

                {motivoAtestado === "Viagem" && (
                  <label>
                    Para qual país?
                    <SelectCostumizado
                      label="Selecione o país"
                      opcoes={paises}
                      comBusca={true}
                    />
                  </label>
                )}
              </>
            )}
            <label>
              {" "}
              <span>
                Qual especialidade?{" "}
                <i
                  className="fa-solid fa-circle-question icone-duvida"
                  onClick={() => setModalAberto(true)}
                ></i>
              </span>
              <SelectCostumizado
                label="Escolha uma especialidade"
                opcoes={[
                  "Clínico Geral",
                  "Cardiologista",
                  "Dermatologista",
                  "Felinos",
                  "Gastroenterologista",
                  "Imagem",
                  "Nefrologista",
                  "Neurologista",
                  "Nutrólogo/Nutricionista",
                  "Oftalmologista",
                  "Oncologista",
                  "Ortopedista",
                  "Silvestres",
                  "Grandes Animais",
                ]}
                valor={especialidade}
                aoEscolher={setEspecialidade}
              />
            </label>
          <button
            className="botao-buscar"
            onClick={() => {
              // O ?. só chama o aoBuscar se ele foi passado (o Mural antigo não passa)
              aoBuscar?.({ cidade: cidade === TODAS_AS_CIDADES ? "" : cidade });
              if (!fixo) setPainelAberto(false);
            }}
          >
            Buscar
          </button>
        </div>
      )}

      <ModalDuvidas
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      />
    </div>
  );
}
