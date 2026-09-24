# Prospecção Fantástica - Frontendd

Frontend do sistema CRM de prospecção, construído com Vite, React, TypeScript e shadcn/ui.

> **Nota**: O backend está em um repositório separado. Veja [README_FRONTEND.md](README_FRONTEND.md) para documentação completa.

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env com:
# VITE_API_URL=http://localhost:3333/api
# VITE_BETTER_AUTH_URL=http://localhost:3333/api/auth

# Iniciar servidor de desenvolvimento
npm run dev
```

## 📚 Documentação Completa

Veja [README_FRONTEND.md](README_FRONTEND.md) para documentação detalhada.

## 🏗️ Tecnologias

- **Vite** - Build tool
- **React** - UI Framework
- **TypeScript** - Tipagem estática
- **shadcn/ui** - Componentes UI
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **TanStack Query** - Estado servidor
- **Better Auth** - Autenticação

## 📝 Scripts

- `npm run dev` - Desenvolvimento
- `npm run build` - Build produção
- `npm run preview` - Preview do build
- `npm run lint` - Linter

## 🚢 Deploy

Pipeline automatizado via GitHub Actions e Coolify.

- **Pull Request aberto** → roda `CI` (lint + typecheck + build) — sem acesso a configuração de produção
- **Merge em `main`** → roda `Deploy`:
  1. Lê `VITE_*` do 1Password (`production-web/public-config`)
  2. Build da imagem Docker (multi-stage Vite + nginx) com elas como build args
  3. Push para `ghcr.io/gandalfmax777/prospec-o-fan-tica` (`latest` + `sha-<commit>`)
  4. Dispara o deploy no Coolify, que puxa a nova imagem e faz rolling update

A configuração de produção vem do **1Password** (vault `cdr-prospeccao`); o
único secret do repositório é `OP_SERVICE_ACCOUNT_TOKEN`. As variáveis `VITE_*`
são configuração **pública** de build-time (ficam no bundle JS) — alterar uma
exige rebuild. Detalhes: [docs/PRODUCTION_CONFIG.md](docs/PRODUCTION_CONFIG.md).
