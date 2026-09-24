# Configuração de produção (1Password)

A configuração de produção vive no 1Password, no vault `cdr-prospeccao`. O
GitHub guarda um único secret, `OP_SERVICE_ACCOUNT_TOKEN`, que o workflow
Deploy usa para ler o vault.

> **Não crie GitHub Secret novo para variável da aplicação.** Adicione o campo
> no 1Password e referencie no workflow. Um GitHub Secret de aplicação precisa
> de justificativa explícita no PR.

## Estrutura do vault

```
cdr-prospeccao                      (vault)
├── production-web                  (item)
│   └── public-config               (seção)  VITE_API_URL, VITE_BETTER_AUTH_URL
├── production-api                           runtime, database, migration, integrations
│                                            (usado só pelo repositório da API)
└── production-coolify
    ├── shared                               COOLIFY_BASE_URL, COOLIFY_TOKEN
    ├── web                                  APP_UUID   (aplicação deste frontend)
    └── api                                  APP_UUID   (aplicação da API)
```

Cada campo é referenciado como `op://<vault>/<item>/<seção>/<campo>`, por
exemplo `op://cdr-prospeccao/production-web/public-config/VITE_API_URL`. O
rótulo do campo é exatamente o nome da variável.

## VITE_* são configuração pública de build

`VITE_API_URL` e `VITE_BETTER_AUTH_URL` são lidas por `src/services/api.ts` e
`src/services/auth.ts` via `import.meta.env`, e o Vite **as compila no bundle
JS** — qualquer navegador as vê. Não são segredo; vêm do 1Password só por ele
ser a fonte única da configuração de produção.

Consequências:

- Elas chegam ao `docker build` como `--build-arg` e a mais nada. Nenhuma
  credencial (`DATABASE_URL`, `BETTER_AUTH_SECRET`, chaves de API…) entra no
  build do frontend — não há o que fazer com elas aqui, e o que entra no
  bundle é público.
- **Nunca** ponha segredo numa variável `VITE_*`.
- Mudar uma delas exige **rebuild**: o container nginx só serve arquivos
  estáticos, então não há variável de runtime para sincronizar no Coolify.
  Para aplicar sem mudança de código: *Actions → Deploy → Run workflow*.
- O CI de PR builda sem elas (o código cai no fallback `localhost`) e não tem
  acesso ao 1Password.

## Quem lê o quê

| Job | Lê do 1Password | Para onde vai |
|---|---|---|
| `build-and-push` | `production-web/public-config` | `--build-arg` → bundle |
| `deploy` | `production-coolify/shared` + `production-coolify/web` | `POST ${COOLIFY_BASE_URL}/api/v1/deploy?uuid=${APP_UUID}&force=false` |
| `CI` (PR) | nada | — |

A URL de deploy é montada em memória a partir de `COOLIFY_BASE_URL` e
`APP_UUID`; não existe mais `COOLIFY_WEBHOOK_URL`.

## OP_SERVICE_ACCOUNT_TOKEN

É o mesmo token do repositório da API — uma Service Account com acesso
**somente leitura** a **somente** o vault `cdr-prospeccao`. Criação e rotação:
ver `docs/PRODUCTION_CONFIG.md` do repositório da API.

Para cadastrar aqui é preciso ser admin deste repositório: **Settings →
Secrets and variables → Actions → New repository secret**, nome
`OP_SERVICE_ACCOUNT_TOKEN`. Pela CLI, sem o valor passar pelo histórico do
shell: `gh secret set OP_SERVICE_ACCOUNT_TOKEN -R Gandalfmax777/prospec-o-fan-tica`.

Este repositório é **público**: os logs do Actions também são. O workflow
nunca imprime valor carregado, só `✓ NOME loaded`.

## Troubleshooting sem expor valor

- **"X ausente ou vazio"** — o campo não existe, está vazio ou com rótulo
  diferente na seção indicada.
- **"precisa começar com https://"** — o valor no 1Password não é uma URL de
  produção.
- **Falha no passo *Load … from 1Password*** — referência não resolve ou o
  token não tem acesso ao vault. Com a CLI autenticada, teste só a existência:
  `op read "op://cdr-prospeccao/production-web/public-config/VITE_API_URL" >/dev/null && echo ok`.
- **HTTP 401/403 no deploy** — `COOLIFY_TOKEN` sem permissão `deploy`,
  expirado, ou de um *Member* do time. **404** — `APP_UUID` errado
  (`web` × `api`). **405** — algo voltou a usar GET; desde o Coolify v4.2.0
  o endpoint só aceita POST.
- **`***` no meio de mensagens** — todo valor carregado é mascarado, mesmo
  os públicos; um trecho igual a uma URL de produção vira `***` no log.

Não use `env`, `printenv`, `set -x` nem *debug logging* do Actions para
investigar este workflow.
