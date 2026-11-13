import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Perfil from "./paginas/Perfil.jsx";
import Login from "./paginas/Login.jsx";
import CompletarCadastro from "./paginas/CompletarCadastro.jsx";
import MeusAnimais from "./paginas/MeusAnimais.jsx";
import Splash from "./paginas/Splash.jsx";
import TelaInicial from "./paginas/TelaInicial.jsx";
import TelaBuscar from "./paginas/TelaBuscar.jsx";
import MeuPerfil from "./paginas/MeuPerfil.jsx";
import PerfilPet from "./paginas/PerfilPet.jsx";
import PaginaNaoEncontrada from "./paginas/PaginaNaoEncontrada.jsx";
import Agenda from "./paginas/Agenda.jsx";

export default function App() {
  const [mostrarSplash, setMostrarSplash] = useState(true);

  useEffect(() => {
    const temporizador = setTimeout(() => setMostrarSplash(false), 2500);
    return () => clearTimeout(temporizador);
  }, []);

  if (mostrarSplash) return <Splash />;

  return (
    <Routes>
      <Route path="/" element={<TelaInicial />} />
      <Route path="/buscar" element={<TelaBuscar />} />
      <Route path="/meu-perfil" element={<MeuPerfil />} />
      <Route path="/pet/:id" element={<PerfilPet />} />
      <Route path="/profissional/:id" element={<Perfil />} />
      <Route path="/login" element={<Login />} />
      <Route path="/completar-cadastro" element={<CompletarCadastro />} />
      <Route path="/meus-animais" element={<MeusAnimais />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="*" element={<PaginaNaoEncontrada />} />
    </Routes>
  );
}
