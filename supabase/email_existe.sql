-- Diz se já existe uma conta com esse e-mail (true ou false).
-- Usada no "Criar conta": quando a pessoa sai do campo E-mail, aparece o aviso
-- "Já existe uma conta com este e-mail" (igual ao cpf_existe com o CPF).
-- Ex.: select email_existe('bia@teste.com');  ->  true
--
-- security definer: roda com permissão do dono, porque a tabela auth.users
-- não pode ser lida pelo app. A função só devolve true/false, nunca os dados.
-- Pode rodar de novo sem problema (create or replace).
create or replace function public.email_existe(email_busca text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(trim(email_busca))
  );
$$;
