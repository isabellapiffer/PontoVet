-- Regras de segurança (RLS) da tabela pets e da pasta de fotos dos pets.
-- Pode rodar quantas vezes quiser no SQL Editor do Supabase.

-- ANTES DE RODAR: confira se a pasta fotos-pets é pública.
-- Rode só esta linha e veja se "public" vem true:
--   select id, public from storage.buckets where id = 'fotos-pets';
-- Se vier false, NÃO rode o resto: as fotos dos pets parariam de aparecer.

-- Tabela pets: cada tutor só vê, cadastra, altera e remove os próprios pets
alter table pets enable row level security;

drop policy if exists "Tutor vê seus próprios pets" on pets;
create policy "Tutor vê seus próprios pets" on pets
  for select to authenticated
  using (auth.uid() = tutor_id);

drop policy if exists "Tutor insere seus próprios pets" on pets;
create policy "Tutor insere seus próprios pets" on pets
  for insert to authenticated
  with check (auth.uid() = tutor_id);

drop policy if exists "Tutor edita seus próprios pets" on pets;
create policy "Tutor edita seus próprios pets" on pets
  for update to authenticated
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

drop policy if exists "Tutor remove seus próprios pets" on pets;
create policy "Tutor remove seus próprios pets" on pets
  for delete to authenticated
  using (auth.uid() = tutor_id);

-- Pasta (bucket) pública das fotos dos pets: no máximo 2 MB por foto e só imagens.
-- O app já envia a foto recortada em JPEG (até 800x800, uns 200 KB); o limite
-- barra quem tentar mandar arquivo grande ou de outro tipo direto pela API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-pets', 'fotos-pets', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Fotos dos pets: cada tutor só mexe na PRÓPRIA pasta
-- (fotos-pets/<id do usuário>/<nome>.jpg).
-- Ver a foto pelo link não precisa de regra: a pasta é pública.
-- Antes existia "Qualquer um vê fotos de pets", que deixava qualquer pessoa,
-- mesmo sem login, listar todas as fotos e as pastas de todos os tutores.
drop policy if exists "Qualquer um vê fotos de pets" on storage.objects;

drop policy if exists "Tutor vê foto na própria pasta" on storage.objects;
create policy "Tutor vê foto na própria pasta" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos-pets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Tutor envia foto na própria pasta" on storage.objects;
create policy "Tutor envia foto na própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-pets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Tutor atualiza foto na própria pasta" on storage.objects;
create policy "Tutor atualiza foto na própria pasta" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos-pets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fotos-pets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Tutor remove foto na própria pasta" on storage.objects;
create policy "Tutor remove foto na própria pasta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos-pets' and (storage.foldername(name))[1] = auth.uid()::text);
