-- Foto de perfil do tutor.
-- Pode rodar quantas vezes quiser no SQL Editor do Supabase.

-- Coluna com o link da foto
alter table tutores add column if not exists foto_url text;

-- Pasta (bucket) pública só para fotos de perfil, separada das fotos dos pets.
-- Limite de 2 MB por foto e só imagens (o app já envia JPEG recortado).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-perfil', 'fotos-perfil', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
-- Se a pasta já existir, garante o limite e os tipos mesmo assim
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Regras: cada pessoa só envia, troca ou apaga fotos dentro da PRÓPRIA pasta
-- (a pasta tem o id do usuário: fotos-perfil/<id do usuário>/<nome aleatório>.jpg).
-- Ver a foto pelo link não precisa de regra: a pasta é pública.
-- (A regra de "ler" abaixo é só para o app conseguir trocar/apagar a foto antiga.)
drop policy if exists "Foto de perfil: ler a própria" on storage.objects;
create policy "Foto de perfil: ler a própria" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Foto de perfil: enviar a própria" on storage.objects;
create policy "Foto de perfil: enviar a própria" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Foto de perfil: trocar a própria" on storage.objects;
create policy "Foto de perfil: trocar a própria" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Foto de perfil: apagar a própria" on storage.objects;
create policy "Foto de perfil: apagar a própria" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text);
