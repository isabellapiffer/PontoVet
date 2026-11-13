import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { vets } from "../dados.js";
import { supabase } from "../supabaseClient.js";
import BotaoVoltar from "../componentes/BotaoVoltar.jsx";
import { SeloNota } from "./Mural.jsx/Mural.jsx";
import { formatarNota } from "../nota.js";
import { cidadeDoUsuario, distanciaKm, textoDistancia } from "../distancia.js";
import "./Mural.jsx/mural.css";
import "./perfil.css";

// Como cada espécie aparece escrita no "Atende"
const nomesEspecies = {
  "cão": "Cães",
  "gato": "Gatos",
  "bovino/pequeno ruminante": "Bovinos e pequenos ruminantes",
  "cavalo": "Cavalos",
  "aves": "Aves",
};

export default function Perfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const vet = vets.find((v) => v.id === Number(id));

  // null = ainda conferindo; true = logada; false = não logada
  const [logada, setLogada] = useState(null);
  // Distância calculada da cidade da pessoa até a do veterinário
  // (null = ainda não calculou ou não deu para calcular: a linha não aparece)
  const [distancia, setDistancia] = useState(null);
  // true = a foto está aberta grande na tela
  const [fotoAberta, setFotoAberta] = useState(false);

  // Com a foto aberta, a tecla Esc fecha
  useEffect(() => {
    if (!fotoAberta) return;

    function aoApertarTecla(evento) {
      if (evento.key === "Escape") setFotoAberta(false);
    }

    document.addEventListener("keydown", aoApertarTecla);
    return () => document.removeEventListener("keydown", aoApertarTecla);
  }, [fotoAberta]);

  useEffect(() => {
    async function conferirLogin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // !! transforma em true/false: tem usuário = true, não tem = false
      setLogada(!!user);

      // Mesma distância calculada da lista do Buscar
      if (user && vet) {
        const km = distanciaKm(await cidadeDoUsuario(), vet.cidade);
        // Mesma cidade: textoDistancia devolve null e a linha some
        if (km !== null) setDistancia(textoDistancia(km));
      }
    }

    conferirLogin();
  }, [vet]);

  if (!vet) {
    return <p>Veterinário não encontrado.</p>;
  }

  const avaliacoes = vet.avaliacoes || [];

  return (
    <div className="perfil-pagina">
      <div className="topo-com-voltar">
        <BotaoVoltar aoClicar={() => navigate(-1)} />
      </div>

      {/* Os profissionais do dados.js são inventados: reforça o aviso do Buscar */}
      <p className="perfil-aviso-fake">Perfil fictício, só para demonstração.</p>

      {/* Foto e nome lado a lado */}
      <header className="perfil-topo">
        {/* Clicar na foto abre ela grande */}
        <button
          className="perfil-foto-botao"
          aria-label="Ver a foto grande"
          onClick={() => setFotoAberta(true)}
        >
          <img src={vet.foto} alt={vet.nome} className="perfil-foto" />
        </button>
        <div className="perfil-topo-textos">
          <h1 className="perfil-nome">{vet.nome}</h1>
          <span className="etiqueta-especialidade">{vet.especialidade}</span>
          <span className="perfil-nota-linha">
            <i className="fa-solid fa-paw"></i>
            <b>{formatarNota(vet.nota)}</b>
            {vet.nota ? " avaliação" : ""}
          </span>
        </div>
      </header>

      {/* Quadro com endereço (ou cidade) e espécies */}
      <section className="perfil-quadro">
        <div className="perfil-quadro-linha">
          <i className="fa-solid fa-location-dot perfil-quadro-icone"></i>
          <div className="perfil-quadro-textos">
            {/* Logada: endereço completo. Não logada: só a cidade */}
            <span className="perfil-rotulo">
              {logada ? "Endereço" : "Cidade"}
            </span>
            <span className="perfil-valor">
              {logada ? vet.endereco : vet.cidade}
            </span>
            {logada ? (
              distancia && (
                <span className="perfil-detalhe">{distancia} de você</span>
              )
            ) : (
              <span className="perfil-detalhe">
                <i className="fa-solid fa-lock"></i> Endereço completo só com
                login
              </span>
            )}
          </div>
        </div>

        <div className="perfil-quadro-linha">
          <i className="fa-solid fa-paw perfil-quadro-icone"></i>
          <div className="perfil-quadro-textos">
            <span className="perfil-rotulo">Atende</span>
            <div className="perfil-especies">
              {vet.especies.map((especie) => (
                <span key={especie} className="perfil-especie">
                  {nomesEspecies[especie] || especie}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {vet.sobre && (
        <section className="perfil-secao">
          <h2 className="perfil-secao-titulo">Sobre mim</h2>
          <p className="perfil-texto">{vet.sobre}</p>
        </section>
      )}

      <section className="perfil-secao">
        <h2 className="perfil-secao-titulo">Avaliações</h2>

        {avaliacoes.length === 0 ? (
          <p className="perfil-detalhe">Ainda não tem avaliações.</p>
        ) : (
          <>
            <div className="perfil-media">
              <SeloNota nota={vet.nota} grande />
              <span className="perfil-detalhe">
                média de {avaliacoes.length}{" "}
                {avaliacoes.length === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>

            {avaliacoes.map((avaliacao) => (
              <article key={avaliacao.id} className="avaliacao">
                <div className="avaliacao-topo">
                  {/* Logada vê quem avaliou; sem login, a avaliação é anônima
                      (sem o nome do tutor e sem o nome do pet) */}
                  {logada ? (
                    <span className="avaliacao-autor">
                      <span className="avaliacao-avatar"></span>
                      {avaliacao.autor}
                    </span>
                  ) : (
                    <span className="perfil-detalhe">
                      {avaliacao.data} · {avaliacao.atendimento}
                    </span>
                  )}
                  <span className="selo-nota avaliacao-nota">
                    {formatarNota(avaliacao.nota)}
                  </span>
                </div>

                <p className="perfil-texto">{avaliacao.comentario}</p>

                {logada && (
                  <span className="perfil-detalhe">
                    {avaliacao.data} · {avaliacao.atendimento} ·{" "}
                    {avaliacao.pet}
                  </span>
                )}
              </article>
            ))}
          </>
        )}
      </section>

      {/* Foto grande: fundo escuro na tela toda; clicar em qualquer lugar fecha */}
      {fotoAberta && (
        <div
          className="foto-grande-fundo"
          role="dialog"
          aria-label={`Foto de ${vet.nome}`}
          onClick={() => setFotoAberta(false)}
        >
          <button
            className="foto-grande-fechar"
            aria-label="Fechar a foto"
            onClick={() => setFotoAberta(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <img src={vet.foto} alt={vet.nome} className="foto-grande" />
        </div>
      )}

      {/* Enquanto confere o login (null), não mostra nenhum rodapé,
          para não piscar o "Fazer login" para quem já está logada */}
      {logada === true && (
        <div className="perfil-rodape">
          {/* O agendamento ainda não existe: por enquanto o botão não faz nada */}
          <button className="botao-login">Agendar</button>
        </div>
      )}

      {logada === false && (
        <div className="perfil-rodape perfil-rodape-sem-login">
          <p className="perfil-rodape-texto">
            Entre na sua conta para ver o endereço e agendar.
          </p>
          <button
            className="botao-login"
            onClick={() =>
              navigate("/login", { state: { voltarPara: location.pathname } })
            }
          >
            Fazer login
          </button>
        </div>
      )}
    </div>
  );
}
