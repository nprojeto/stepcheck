# StepCheck — NOVALE

Sistema de gestão de testes e aprovações.

- **Site:** https://nprojeto.github.io/stepcheck/
- **API:** Supabase Edge Function `api` (arquivo `api.index.ts`, publicado no painel do Supabase)
- **Banco:** Supabase PostgreSQL (`schema.sql`, executado no SQL Editor — **não versionar aqui**, contém senha provisória)

## Publicação
A cada commit na branch `main`, o GitHub Actions (`.github/workflows/deploy.yml`) gera o site Nuxt e publica no GitHub Pages.
Acompanhe em **Actions**. Configuração: **Settings → Pages → Source: GitHub Actions**.

## Estrutura
- `app/` — páginas, componentes e regras de tela (Nuxt 4 / Vue 3)
- `public/` — logos e ícones
- `nuxt.config.ts` — endereços da API e chave **pública** do Supabase
