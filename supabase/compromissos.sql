-- Tabela compromissos: tudo o que aparece na Agenda e não é lembrete de
-- vacina/remédio do pet (consulta, exame, outro e vacina AGENDADA).
--   origem 'manual' = a pessoa adicionou pelo "+" da Agenda
--   origem 'app'    = agendado com um veterinário pelo app (fluxo futuro)
-- Pode rodar quantas vezes quiser no SQL Editor do Supabase.

create table if not exists compromissos (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references tutores(id) on delete cascade,
  pet_id uuid not null references pets(id) on delete cascade,
  tipo text not null check (tipo in ('consulta', 'exame', 'outro', 'vacina', 'vermifugo', 'antiparasitario')),
  titulo text not null check (char_length(titulo) between 1 and 100),
  data date not null,
  hora time,
  local text check (char_length(local) <= 150),
  observacao text check (char_length(observacao) <= 500),
  origem text not null default 'manual' check (origem in ('manual', 'app')),
  profissional_id uuid references profissionais(id) on delete set null,
  criado_em timestamptz default now()
);

-- Vermífugo e antipulgas/carrapatos AGENDADOS também entram na agenda.
-- (A tabela já existia: o "check" antigo é trocado pelo novo. O nome
-- compromissos_tipo_check é o que o Supabase deu ao check da coluna tipo.)
alter table compromissos drop constraint if exists compromissos_tipo_check;
alter table compromissos add constraint compromissos_tipo_check
  check (tipo in ('consulta', 'exame', 'outro', 'vacina', 'vermifugo', 'antiparasitario'));

-- Preparo do exame agendado (vazio = não precisa de preparo):
-- { "jejumHoras": 8, "medicamento": { "nome": "Luftal", "instrucao": "10 gotas, 1 hora antes" },
--   "outro": "Levar a urina em pote" }
alter table compromissos add column if not exists preparo jsonb;
alter table compromissos drop constraint if exists compromissos_preparo_tamanho;
alter table compromissos add constraint compromissos_preparo_tamanho
  -- octet_length(preparo::text): bytes do texto de verdade (pg_column_size mede o dado
  -- já compactado, e um texto grande e repetido passava sem ser barrado)
  check (preparo is null or octet_length(preparo::text) < 2000);

-- Deixa rápida a busca "compromissos do tutor, por data" (é o que a Agenda faz)
create index if not exists compromissos_tutor_data on compromissos (tutor_id, data);

-- Regras de segurança: cada tutor só vê e mexe nos próprios compromissos
alter table compromissos enable row level security;

drop policy if exists "Tutor vê seus compromissos" on compromissos;
create policy "Tutor vê seus compromissos" on compromissos
  for select to authenticated
  using (auth.uid() = tutor_id);

-- Inserir: só para si mesmo, só para um pet DELE, e só como 'manual'.
-- Os de origem 'app' (com veterinário) vão ter uma regra própria quando o
-- agendamento pelo app existir; assim ninguém finge um agendamento do app.
drop policy if exists "Tutor adiciona seus compromissos" on compromissos;
create policy "Tutor adiciona seus compromissos" on compromissos
  for insert to authenticated
  with check (
    auth.uid() = tutor_id
    and origem = 'manual'
    and profissional_id is null
    and exists (select 1 from pets where pets.id = pet_id and pets.tutor_id = auth.uid())
  );

-- Editar: só os próprios e só os manuais (os do app vão usar "Remarcar")
drop policy if exists "Tutor edita seus compromissos" on compromissos;
create policy "Tutor edita seus compromissos" on compromissos
  for update to authenticated
  using (auth.uid() = tutor_id and origem = 'manual')
  with check (
    auth.uid() = tutor_id
    and origem = 'manual'
    and profissional_id is null
    and exists (select 1 from pets where pets.id = pet_id and pets.tutor_id = auth.uid())
  );

-- Remover: só os próprios e só os manuais (os do app, com veterinário, vão ter
-- um jeito próprio de cancelar, para o profissional ficar sabendo)
drop policy if exists "Tutor remove seus compromissos" on compromissos;
create policy "Tutor remove seus compromissos" on compromissos
  for delete to authenticated
  using (auth.uid() = tutor_id and origem = 'manual');
