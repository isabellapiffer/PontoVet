import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMedkitOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { hojeISO, marcarMedicacaoComoDada } from "../lembretes.js";
import { deDataISO } from "../formatadores.js";
import "./lembretes.css";

// Lista de lembretes (medicações, vacinas, vermífugo, antipulgas e preparo de
// exame que chegaram na data).
// mostrarPet: na tela inicial aparece o nome do pet; no perfil do pet, não.
// aoAtualizar: chamado depois do "Feito", para a tela buscar os dados de novo.
export default function Lembretes({ lembretes, tutorId, mostrarPet, aoAtualizar }) {
  const navigate = useNavigate();
  const [salvando, setSalvando] = useState(null);
  const [erro, setErro] = useState("");

  if (!lembretes.length) return null;

  const hoje = hojeISO();

  async function feito(lembrete) {
    setErro("");
    setSalvando(lembrete.id);
    const error = await marcarMedicacaoComoDada(lembrete, tutorId);
    setSalvando(null);

    if (error) {
      console.error(error);
      setErro("Não foi possível marcar como feito. Tente de novo.");
      aoAtualizar(); // busca os dados de novo, caso tenham mudado
      return;
    }
    aoAtualizar();
  }

  return (
    <section className="lembretes">
      <h2 className="lembretes-titulo">Lembretes</h2>

      {erro && <span className="aviso-cpf">{erro}</span>}

      <ul className="lembretes-lista">
        {lembretes.map((lembrete) => (
          <li key={lembrete.id} className="lembretes-item">
            <button
              type="button"
              className="lembretes-abrir"
              onClick={() => navigate(`/pet/${lembrete.pet.id}`)}
            >
              <span className="lembretes-icone">
                {lembrete.tipo === "vacina" ? <IoShieldCheckmarkOutline /> : <IoMedkitOutline />}
              </span>
              <span className="lembretes-textos">
                <strong>
                  {lembrete.titulo}
                  {mostrarPet && ` · ${lembrete.pet.nome}`}
                </strong>
                {/* Preparo de exame (jejum que começou ontem) não está atrasado */}
                <span
                  className={
                    lembrete.data < hoje && lembrete.tipo !== "preparo" ? "lembretes-atrasado" : ""
                  }
                >
                  {lembrete.data === hoje ? "Hoje" : `Desde ${deDataISO(lembrete.data)}`}
                </span>
              </span>
            </button>

            {lembrete.tipo === "medicacao" && (
              <button
                type="button"
                className="lembretes-feito"
                onClick={() => feito(lembrete)}
                disabled={salvando === lembrete.id}
              >
                {salvando === lembrete.id ? "..." : "Feito"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
