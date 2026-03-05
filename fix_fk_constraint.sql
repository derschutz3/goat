-- Script para permitir exclusão de lojas mesmo com chamados vinculados

-- 1. Remove a restrição antiga (que bloqueia a exclusão)
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_store_id_fkey;

-- 2. Adiciona a nova restrição com ON DELETE SET NULL
-- Isso significa: se a loja for apagada, o campo store_id no chamado fica vazio (NULL)
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_store_id_fkey
FOREIGN KEY (store_id)
REFERENCES public.stores (id)
ON DELETE SET NULL;
