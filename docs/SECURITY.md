# Frontend — Segurança

## Sessão e cookies

A sessão é do Better Auth e depende de cookies. O frontend deve:

- usar `credentials: "include"` nas requisições
- não armazenar tokens sensíveis em localStorage

## Dados sensíveis

Mesmo que o backend passe a criptografar campos, o frontend deve:

- mascarar telefone quando possível (ex.: `(**) *****-1234`)
- evitar logs com dados pessoais
- tratar erros sem expor payloads completos

## Roadmap

- Ajustar UI para suportar telefone mascarado + busca via hash (caso implementado no backend)
