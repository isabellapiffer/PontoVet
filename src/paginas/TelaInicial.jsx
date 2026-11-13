import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { temCadastro, linkCompletarCadastro } from "../perfil.js";
import MenuSuperior from "../componentes/MenuSuperior.jsx";
import BuscarAtendimento from "../componentes/BuscarAtendimento.jsx";
import CarrosselPets from "../componentes/CarrosselPets.jsx";
import ProximosAgendamentos from "../componentes/ProximosAgendamentos.jsx";
import Lembretes from "../componentes/Lembretes.jsx";
import {
  lembretesDeHoje,
  avisosDoPreparoDeHoje,
  hojeISO,
  proximosDaTelaInicial,
} from "../lembretes.js";
import MenuInferior from "../componentes/MenuInferior.jsx";
import "./telainicial.css";

export default function TelaInicial() {
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usuarioId, setUsuarioId] = useState(null);

  // Compromissos de hoje em diante: para os Próximos agendamentos
  // e para os avisos de jejum e remédio dos exames com preparo
  const [compromissos, setCompromissos] = useState([]);

  // medicacoes, vacinas, vermifugacoes e antiparasitarios: para montar os lembretes
  function buscarPets(id) {
    return supabase
      .from("pets")
      .select("id, nome, especie, foto_url, medicacoes, vacinas, vermifugacoes, antiparasitarios")
      .eq("tutor_id", id)
      .order("criado_em", { ascending: false });
  }

  // Se der erro, só ficam sem os próximos compromissos e sem os avisos
  async function carregarCompromissos(id) {
    const { data, error } = await supabase
      .from("compromissos")
      .select("id, pet_id, tipo, titulo, data, hora, local, preparo")
      .eq("tutor_id", id)
      .gte("data", hojeISO());
    if (error) console.error(error);
    else setCompromissos(data || []);
  }

  async function recarregarPets() {
    const { data, error } = await buscarPets(usuarioId);
    if (error) console.error(error);
    else setPets(data);
  }

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      // Busca o tutor e os pets AO MESMO TEMPO (Promise.all),
      // em vez de esperar um terminar para começar o outro.
      const [respostaTutor, respostaPets] = await Promise.all([
        supabase
          .from("tutores")
          .select("nome, rua, numero, cidade, estado, foto_url")
          .eq("id", user.id)
          .maybeSingle(),
        buscarPets(user.id),
        carregarCompromissos(user.id),
      ]);

      if (respostaTutor.error) {
        console.error(respostaTutor.error);
      } else if (!respostaTutor.data && !(await temCadastro(user.id))) {
        navigate(linkCompletarCadastro("/"));
        return;
      } else {
        setTutor(respostaTutor.data);
      }

      setUsuarioId(user.id);
      if (respostaPets.error) console.error(respostaPets.error);
      else setPets(respostaPets.data);

      setCarregando(false);
    }

    iniciar();
  }, []);

  let endereco = "";
  if (tutor?.rua) {
    endereco = tutor.numero ? `${tutor.rua}, ${tutor.numero}` : tutor.rua;
    if (tutor.cidade) endereco += ` - ${tutor.cidade}`;
  }

  return (
    <div className="tela-inicial">
      <MenuSuperior nome={tutor?.nome} endereco={endereco} foto={tutor?.foto_url} />
      <BuscarAtendimento />
      <CarrosselPets pets={pets} carregando={carregando} />
      <Lembretes
        // Os avisos do preparo de exame entram junto, depois dos outros lembretes
        lembretes={[...lembretesDeHoje(pets), ...avisosDoPreparoDeHoje(compromissos, pets)]}
        tutorId={usuarioId}
        mostrarPet
        aoAtualizar={recarregarPets}
      />
      <ProximosAgendamentos agendamentos={proximosDaTelaInicial(pets, compromissos, hojeISO())} />
      <MenuInferior />
    </div>
  );
}
