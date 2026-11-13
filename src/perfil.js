import { supabase } from "./supabaseClient.js";

// Confere se a pessoa logada já preencheu o cadastro (de tutor ou de profissional).
// Quem só tem o login (e-mail e senha) ainda não tem cadastro.
export async function temCadastro(usuarioId) {
  const { data: tutor } = await supabase
    .from("tutores")
    .select("id")
    .eq("id", usuarioId)
    .maybeSingle();

  if (tutor) return true;

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id")
    .eq("id", usuarioId)
    .maybeSingle();

  return Boolean(profissional);
}

export function linkCompletarCadastro(voltarPara) {
  return `/completar-cadastro?voltar=${encodeURIComponent(voltarPara)}`;
}
