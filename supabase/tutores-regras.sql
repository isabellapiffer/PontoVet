-- Regra de segurança (RLS) da tabela "tutores": cada pessoa só altera o PRÓPRIO cadastro.
-- Sem ela, o Supabase não dá erro ao salvar o Meu perfil: só não altera nada.
-- Pode rodar quantas vezes quiser no SQL Editor do Supabase.

drop policy if exists "Tutor altera o próprio cadastro" on tutores;
create policy "Tutor altera o próprio cadastro" on tutores
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
