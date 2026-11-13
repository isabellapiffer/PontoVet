import { useNavigate } from "react-router-dom";
import { IoAdd, IoPaw } from "react-icons/io5";
import { imagemPadraoPorEspecie } from "../dadosPets.js";
import "./carrosselpets.css";

function CardPetCarrossel({ pet }) {
  const navigate = useNavigate();
  const foto = pet.foto_url || imagemPadraoPorEspecie[pet.especie];

  return (
    <button
      className="carrossel-card"
      onClick={() => navigate(`/pet/${pet.id}`)}
    >
      {foto ? (
        <img src={foto} alt={pet.nome} className="carrossel-foto" />
      ) : (
        <div className="carrossel-foto carrossel-foto-vazia">
          <IoPaw />
        </div>
      )}
      <span className="carrossel-nome">{pet.nome}</span>
    </button>
  );
}

export default function CarrosselPets({ pets, carregando }) {
  const navigate = useNavigate();

  function abrirCadastroDePet() {
    navigate("/meus-animais", { state: { abrirFormulario: true } });
  }

  return (
    <section className="carrossel-pets">
      <h2 className="carrossel-titulo">Meus animais</h2>

      <div className="carrossel-lista">
        {pets.map((pet) => (
          <CardPetCarrossel key={pet.id} pet={pet} />
        ))}

        {carregando && (
          <div className="carrossel-card" aria-label="Carregando seus pets">
            <div className="carrossel-foto carrossel-carregando"></div>
            <span className="carrossel-nome-carregando"></span>
          </div>
        )}

        {!carregando && (
          <button className="carrossel-card" onClick={abrirCadastroDePet}>
            <div className="carrossel-foto carrossel-foto-adicionar">
              <IoAdd />
            </div>
            <span className="carrossel-nome">Cadastre seu pet</span>
          </button>
        )}
      </div>
    </section>
  );
}
