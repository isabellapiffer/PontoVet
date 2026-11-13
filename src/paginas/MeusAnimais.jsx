import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import BotaoVoltar from "../componentes/BotaoVoltar.jsx";
import MenuInferior from "../componentes/MenuInferior.jsx";
import FormularioPet from "../componentes/FormularioPet.jsx";
import { supabase } from "../supabaseClient.js";
import { temCadastro, linkCompletarCadastro } from "../perfil.js";
import { imagemPadraoPorEspecie } from "../dadosPets.js";
import "./Mural.jsx/mural.css";
import "./login.css";
import "./animais.css";

function CardPet({ pet }) {
  const imagemPadrao = imagemPadraoPorEspecie[pet.especie];

  return (
    // Mesmo formato do card dos veterinários (classes card-vet do mural.css),
    // com as cores próprias do pet: lilás médio com borda (card-pet, animais.css)
    <Link to={`/pet/${pet.id}`} className="card-vet card-pet">
      {pet.foto_url ? (
        <img src={pet.foto_url} alt={pet.nome} className="card-vet-foto" />
      ) : imagemPadrao ? (
        <img src={imagemPadrao} alt={pet.especie} className="card-vet-foto" />
      ) : (
        <div className="card-vet-foto card-vet-foto-vazia">
          <i className="fa-solid fa-paw"></i>
        </div>
      )}

      <div className="card-vet-textos">
        <h3 className="card-vet-nome">{pet.nome}</h3>
        {pet.especie && (
          <span className="etiqueta-especialidade">{pet.especie}</span>
        )}
        {pet.raca && <span className="card-vet-local">{pet.raca}</span>}
      </div>

      <span className="card-pet-seta">
        <i className="fa-solid fa-chevron-right"></i>
      </span>
    </Link>
  );
}

export default function MeusAnimais() {
  const navigate = useNavigate();
  const location = useLocation();

  const [passo, setPasso] = useState(
    location.state?.abrirFormulario ? "formulario" : "lista"
  );
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  // true quando o Supabase falhou ao buscar os pets
  const [erroCarregar, setErroCarregar] = useState(false);
  // Aviso que o formulário manda ao salvar (ex.: a carteirinha não foi enviada)
  const [avisoAoSalvar, setAvisoAoSalvar] = useState("");

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { state: { voltarPara: "/meus-animais" } });
        return;
      }

      // Confere o cadastro e busca os pets AO MESMO TEMPO (mais rápido)
      const [cadastroOk] = await Promise.all([
        temCadastro(user.id),
        carregarPets(user.id),
      ]);

      if (!cadastroOk) {
        navigate(linkCompletarCadastro("/meus-animais"));
        return;
      }

      setUsuario(user);
      setCarregando(false);
    }

    iniciar();
  }, []);

  async function carregarPets(tutorId) {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("tutor_id", tutorId)
      .order("criado_em", { ascending: false });

    if (error) {
      setErroCarregar(true);
      return;
    }

    setErroCarregar(false);
    setPets(data || []);
  }

  // Enquanto carrega, a tela já aparece (topo + barra de baixo) e só a
  // lista fica esperando. Assim não pisca branco ao clicar em "Animais".
  return (
    <div className="animais-pagina">
      <header className="topo-com-voltar">
        <BotaoVoltar
          aoClicar={() => {
            // No formulário: quem já tem pets volta para a lista;
            // quem ainda não tem nenhum volta para a tela inicial.
            if (passo === "formulario" && pets.length > 0) {
              setPasso("lista");
            } else {
              navigate("/");
            }
          }}
        />
        <h1 className="animais-titulo">
          {passo === "formulario" ? "Cadastrar pet" : "Meus Animais"}
        </h1>
      </header>

      {passo === "lista" && !carregando && erroCarregar && (
        <div className="animais-erro">
          <p className="animais-erro-texto">
            Não foi possível carregar seus pets.
          </p>
          <button
            className="animais-botao-recarregar"
            onClick={() => carregarPets(usuario.id)}
          >
            <i className="fa-solid fa-rotate-right"></i>
            Recarregar a página
          </button>
        </div>
      )}

      {passo === "lista" && !carregando && !erroCarregar && (
        <>
          {avisoAoSalvar && <span className="aviso-cpf">{avisoAoSalvar}</span>}

          {pets.length === 0 && (
            <p className="animais-vazio">
              Você ainda não cadastrou nenhum pet.
            </p>
          )}

          <div className="lista-cards">
            {pets.map((pet) => (
              <CardPet key={pet.id} pet={pet} />
            ))}
          </div>

          <button
            className="botao-login animais-botao-cadastrar"
            onClick={() => setPasso("formulario")}
          >
            Cadastrar pet
          </button>
        </>
      )}

      {passo === "formulario" && !carregando && (
        <FormularioPet
          usuarioId={usuario.id}
          aoSalvar={async (aviso) => {
            await carregarPets(usuario.id);
            setAvisoAoSalvar(aviso);
            setPasso("lista");
          }}
        />
      )}

      <MenuInferior />
    </div>
  );
}
