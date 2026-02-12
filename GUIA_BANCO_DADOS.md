# Guia para Criar um Banco de Dados PostgreSQL Gratuito

Para que sua aplicação funcione corretamente no Firebase/Cloud Run, você precisa de um banco de dados externo.

Abaixo estão duas opções excelentes e **gratuitas** (para começar) que configuram um banco PostgreSQL em minutos.

---

## Opção 1: Neon (Recomendado - Mais Rápido)

O Neon é uma plataforma "Serverless Postgres" extremamente rápida e fácil de usar.

1.  Acesse **[neon.tech](https://neon.tech)**.
2.  Clique em **"Sign Up"** e faça login com sua conta do GitHub ou Google.
3.  Crie um novo projeto (dê um nome, ex: `chamados-app`).
4.  Assim que o projeto for criado, você verá um "Dashboard".
5.  Procure pela seção **"Connection String"**.
6.  Ela se parecerá com isto:
    `postgres://usuario:senha@ep-nome-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
7.  **Copie essa URL**. Ela é a sua `DATABASE_URL`.

---

## Opção 2: Supabase (Muito Popular)

O Supabase é uma alternativa open-source ao Firebase que oferece um banco PostgreSQL completo.

1.  Acesse **[supabase.com](https://supabase.com)**.
2.  Clique em **"Start your project"** e faça login com o GitHub.
3.  Clique em **"New Project"**.
4.  Escolha uma organização (sua conta), dê um nome (ex: `chamados-app`) e defina uma senha forte para o banco de dados (anote essa senha!).
5.  Escolha a região mais próxima (ex: `South America (São Paulo)` se disponível, ou `US East`).
6.  Clique em **"Create new project"**.
7.  Aguarde alguns minutos até o banco ser configurado.
8.  Vá em **Project Settings** (ícone de engrenagem) -> **Database**.
9.  Role até a seção **Connection String** -> **URI**.
10. Copie a string. Ela se parecerá com:
    `postgresql://postgres:[YOUR-PASSWORD]@db.xyz.supabase.co:5432/postgres`
11. Substitua `[YOUR-PASSWORD]` pela senha que você criou no passo 4.

---

## Próximo Passo: Configurar no Deploy

Agora que você tem sua `DATABASE_URL`, use-a no comando de deploy do Cloud Run:

```bash
gcloud run deploy chamados-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=SUA_URL_COPIADA_AQUI"
```

**Importante**: Substitua `SUA_URL_COPIADA_AQUI` pela URL real que você obteve no Neon ou Supabase.
