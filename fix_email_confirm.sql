-- Este script deve ser rodado no SQL Editor do Supabase se você quiser confirmar usuários automaticamente via SQL.
-- Porém, a melhor forma é via PAINEL do Supabase: Authentication > Providers > Email > Confirm Email (OFF).

-- Se quiser confirmar manualmente um usuário específico que não consegue logar, use:
-- UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'email_do_usuario@exemplo.com';

-- Para evitar problemas futuros, você pode criar um gatilho (trigger) que confirma automaticamente novos usuários (NÃO RECOMENDADO PARA PRODUÇÃO SEGURA, mas útil para testes/apps internos):

/*
create or replace function public.auto_confirm_user()
returns trigger as $$
begin
  update auth.users
  set email_confirmed_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.auto_confirm_user();
*/
