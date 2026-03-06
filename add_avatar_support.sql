-- SQL para adicionar suporte a fotos de perfil e garantir permissões

-- 1. Adicionar coluna para URL da foto
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Criar bucket de armazenamento para fotos (se não existir)
-- Nota: Isso geralmente é feito via interface do Supabase (Storage > New Bucket 'avatars'),
-- mas podemos deixar o SQL aqui como referência.
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- 3. Política de Storage (precisa ser configurada no painel do Supabase > Storage > Policies)
-- "Give users access to own folder 1cc69c0k_0": (bucket_id = 'avatars')
