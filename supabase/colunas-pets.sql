-- Colunas da tabela "pets" usadas pelo app (cadastro e histórico clínico).
-- Pode rodar quantas vezes quiser no SQL Editor do Supabase:
-- "if not exists" pula a coluna que já existe, sem dar erro.

-- Dados do animal
alter table pets add column if not exists coloracao text;
alter table pets add column if not exists nascimento_estimado boolean not null default false;
alter table pets drop column if exists idade_aproximada; -- coluna antiga, não é mais usada
alter table pets alter column castrado drop not null; -- vazio = "Não definido"
-- Histórico de pesagens: [{ "peso": 4.2, "unidade": "kg", "data": "2026-10-24", "autor": "tutor" }]
alter table pets add column if not exists pesos jsonb not null default '[]'
  check (jsonb_array_length(pesos) <= 100 and pg_column_size(pesos) <= 20000);

-- Histórico clínico: listas simples (texto)
alter table pets add column if not exists tem_alergia boolean;
alter table pets add column if not exists alergias text[] not null default '{}'
  check (cardinality(alergias) <= 20);
alter table pets add column if not exists tem_cirurgia boolean;
alter table pets add column if not exists cirurgias text[] not null default '{}'
  check (cardinality(cirurgias) <= 20);
alter table pets add column if not exists tem_doencas_anteriores boolean;
alter table pets add column if not exists doencas_anteriores text[] not null default '{}'
  check (cardinality(doencas_anteriores) <= 20);
alter table pets add column if not exists observacoes text
  check (char_length(observacoes) <= 1000);

-- Histórico clínico: listas de "fichas" (jsonb)
alter table pets add column if not exists doencas_anteriores_detalhes jsonb not null default '[]'
  check (jsonb_array_length(doencas_anteriores_detalhes) <= 20 and pg_column_size(doencas_anteriores_detalhes) <= 20000);
-- Doenças em tratamento: [{ "doenca": "Diabetes", "medicamentos": ["Insulina"], "diagnostico": "2026-08" }]
-- (as doenças anteriores também guardam o "diagnostico", só mês e ano)
alter table pets add column if not exists tem_doencas_em_tratamento boolean;
alter table pets add column if not exists doencas_em_tratamento jsonb not null default '[]'
  check (jsonb_array_length(doencas_em_tratamento) <= 20 and pg_column_size(doencas_em_tratamento) <= 20000);
alter table pets add column if not exists tem_medicacoes boolean;
alter table pets add column if not exists medicacoes jsonb not null default '[]'
  check (jsonb_array_length(medicacoes) <= 20 and pg_column_size(medicacoes) <= 20000);
alter table pets add column if not exists vermifugacoes jsonb not null default '[]'
  check (jsonb_array_length(vermifugacoes) <= 50 and pg_column_size(vermifugacoes) <= 20000);
alter table pets add column if not exists antiparasitarios jsonb not null default '[]'
  check (jsonb_array_length(antiparasitarios) <= 50 and pg_column_size(antiparasitarios) <= 20000);
alter table pets add column if not exists vacinas jsonb not null default '[]'
  check (jsonb_array_length(vacinas) <= 100 and pg_column_size(vacinas) <= 30000);
alter table pets add column if not exists testes_felinos jsonb
  check (pg_column_size(testes_felinos) <= 2000);

-- Remédios que NÃO são de uma doença em tratamento (ex.: antibiótico por 7 dias).
-- Mesmo formato das "medicacoes", sem o "doenca".
alter table pets add column if not exists outros_medicamentos jsonb not null default '[]';
-- Os checks destas colunas novas medem o tamanho com octet_length(x::text): conta os
-- bytes do texto de verdade (pg_column_size mede o dado já compactado pelo banco,
-- então um texto grande e repetido passava do limite sem ser barrado).
-- "drop ... if exists" + "add": troca o check antigo pelo novo e pode rodar de novo.
-- O nome pets_<coluna>_check é o que o Supabase deu ao check antigo.
alter table pets drop constraint if exists pets_outros_medicamentos_check;
alter table pets add constraint pets_outros_medicamentos_check
  check (jsonb_array_length(outros_medicamentos) <= 50 and octet_length(outros_medicamentos::text) <= 30000);
-- Exames: [{ "tipo": "Sangue", "nome": "Sangue", "data": "2026-11-03", "local": "Clínica Patas",
--            "resultado": "tudo normal", "autor": "tutor" }]
alter table pets add column if not exists exames jsonb not null default '[]';
alter table pets drop constraint if exists pets_exames_check;
alter table pets add constraint pets_exames_check
  check (jsonb_array_length(exames) <= 100 and octet_length(exames::text) <= 60000);
