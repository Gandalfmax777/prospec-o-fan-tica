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

- **Pull Request aberto** → roda `CI` (lint + typecheck)
- **Merge em `main`** → roda `Deploy`:
  1. Build da imagem Docker (multi-stage Vite + nginx)
  2. Push para `ghcr.io/gandalfmax777/prospec-o-fan-tica:latest`
  3. Trigger do webhook de deploy no Coolify, que puxa a nova imagem e faz rolling update

As variáveis `VITE_*` são injetadas em **build-time** (ficam baked no bundle JS). Por isso são gerenciadas como GitHub Actions secrets — alterar uma exige rebuild da imagem.
