# Guia de Deploy no Firebase Cloud Functions (Python)

Este guia descreve os passos para hospedar a aplicação "Chamados" usando **Firebase Cloud Functions (2nd Gen)**.

## ⚠️ AVISO CRÍTICO: Banco de Dados

Assim como no Cloud Run, o **SQLite não funcionará** corretamente no Cloud Functions porque o ambiente é reiniciado frequentemente e apaga arquivos locais.

**Você PRECISA de um banco PostgreSQL externo.**
Veja o arquivo `GUIA_BANCO_DADOS.md` na raiz do projeto para criar um gratuitamente.

---

## Pré-requisitos

1.  Ter uma conta no Google Cloud Platform (GCP).
2.  Instalar o [Firebase CLI](https://firebase.google.com/docs/cli).
3.  Habilitar o faturamento (Billing) no projeto GCP (obrigatório para Functions).

## Passo a Passo para Deploy

### 1. Login e Configuração

Abra o terminal na pasta do projeto e faça login:

```bash
firebase login
firebase use --add SEU_ID_DO_PROJETO
```

### 2. Configurar Variável de Ambiente (Banco de Dados)

O Cloud Functions precisa saber onde está seu banco de dados. Configure a variável de ambiente usando o comando abaixo.
Substitua a URL pela sua URL real do Neon ou Supabase (veja `GUIA_BANCO_DADOS.md`).

```bash
firebase functions:config:set database.url="postgresql://usuario:senha@host/banco"
```
*Nota: Se este comando falhar ou não for reconhecido para 2nd gen, você pode configurar via Console do GCP ou adicionar ao arquivo `.env` (não recomendado commitar senhas).*

**Alternativa recomendada (arquivo .env):**
Crie um arquivo `.env` na raiz (não commite no git!) com o conteúdo:
```
DATABASE_URL=postgresql://usuario:senha@host/banco
```
O Cloud Functions lerá isso automaticamente.

### 3. Deploy Completo

Este comando enviará seu código Python para o Cloud Functions e os arquivos estáticos para o Firebase Hosting.

```bash
firebase deploy
```

Se quiser deployar apenas uma parte:
```bash
firebase deploy --only functions
firebase deploy --only hosting
```

---

## Estrutura Atualizada

- **main.py**: Ponto de entrada da Cloud Function (envolve sua app Flask).
- **firebase.json**: Configurado para usar Python 3.11 e redirecionar tráfego para a função `chamados`.
- **requirements.txt**: Adicionado `firebase-functions` e `firebase-admin`.

---

## Solução de Problemas

- **Erro de Billing**: O Firebase Functions requer que o projeto tenha um cartão de crédito vinculado (Plano Blaze), mesmo que você use apenas a cota gratuita.
- **Erro "Module not found"**: Certifique-se de que todas as dependências estão no `requirements.txt`.
