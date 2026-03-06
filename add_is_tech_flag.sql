-- Adicionar flag para identificar quem atua como técnico
-- Independentemente do cargo (Admin, Gestor, etc.)

-- 1. Criar coluna
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS is_tech boolean DEFAULT false;

-- 2. Migrar dados existentes:
-- Quem já é 'tecnico' recebe true automaticamente
UPDATE public.app_users 
SET is_tech = true 
WHERE role = 'tecnico';

-- Admins/Managers/Supervisors começam como false (o usuário editará manualmente quem atua como técnico)
-- Se quiser que todos os admins atuais sejam técnicos, descomente a linha abaixo:
-- UPDATE public.app_users SET is_tech = true WHERE role IN ('admin', 'manager', 'supervisor');
