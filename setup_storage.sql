-- Script para configurar o armazenamento de avatares (Storage)

-- 1. Criar o bucket 'avatars' se não existir
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Permitir acesso público para leitura (necessário para exibir as fotos)
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- 3. Permitir upload para usuários autenticados
create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

-- 4. Permitir atualização dos próprios avatares
create policy "Anyone can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' );
