-- Pasta PRIVADA dos documentos dos pets: carteirinha de vacinação,
-- resultado do teste de FIV/FeLV e exames das doenças diagnosticadas.
-- Pode rodar quantas vezes quiser no SQL Editor do Supabase.

-- Pasta (bucket) privada: public = false, então não existe link fixo.
-- Para mostrar o arquivo, o app pede um link que vence em poucos minutos.
-- Limite de 10 MB por arquivo; aceita fotos (inclusive HEIC do iPhone) e PDF.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos-pets', 'documentos-pets', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
-- Se a pasta já existir, garante privada, o limite e os tipos mesmo assim
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Regras: cada tutor só vê, envia e apaga dentro da PRÓPRIA pasta
-- (documentos-pets/<id do usuário>/<id do pet>/<nome aleatório>.jpg).
-- Sem regra de "trocar" (update): cada arquivo ganha um nome novo,
-- então trocar um documento é apagar o antigo e enviar o novo.
drop policy if exists "Documentos: tutor vê os próprios" on storage.objects;
create policy "Documentos: tutor vê os próprios" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos-pets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Documentos: tutor envia os próprios" on storage.objects;
create policy "Documentos: tutor envia os próprios" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos-pets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Documentos: tutor apaga os próprios" on storage.objects;
create policy "Documentos: tutor apaga os próprios" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos-pets' and (storage.foldername(name))[1] = auth.uid()::text);
