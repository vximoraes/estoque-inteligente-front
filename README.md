# Estoque Inteligente — Front-end

Front-end em Next.js 15 (App Router, React 19, TypeScript) do sistema "Estoque Inteligente" — TCC de gestão de estoque com itens, fornecedores, empréstimos, orçamentos, usuários e relatórios. Consome a API separada [`estoque-inteligente-api`](../estoque-inteligente-api) via HTTP, com autenticação por sessão (cookie) via [Better Auth](https://better-auth.com).

## Tecnologias

- **Next.js 15** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Better Auth** — sessão de cookie, OAuth Google
- **TanStack React Query** — cache/fetch de dados remotos
- **react-hook-form** + **Zod** — formulários e validação
- **shadcn/ui** (style `new-york`) + **Tailwind v4**
- **Cypress** — suíte de testes E2E

## Configuração

Variáveis de ambiente (ver `.env.example`):

```env
# URL da API para o navegador (client-side)
NEXT_PUBLIC_API_URL=http://localhost:3010

# URL da API para chamadas server-side (SSR) — no Docker, use o nome do
# serviço da API em vez de localhost
API_URL=http://localhost:3010
```

Para rodar a suíte Cypress, configure também `cypress.env.json` (ver `cypress.env.example.json`): `FRONTEND_URL`, `API_URL` e credenciais de um usuário de teste (`TEST_USER_EMAIL`/`TEST_USER_PASSWORD`) já existente na API.

## Executando

```bash
npm run dev              # servidor de desenvolvimento (Turbopack), porta 3000
npm run build             # build de produção
npm run start              # servidor de produção (após build)
```

Requer a API (`estoque-inteligente-api`) rodando e acessível em `NEXT_PUBLIC_API_URL`/`API_URL`.

### Docker

```bash
docker build -t estoque-inteligente-front .
```

## Testes

Não há testes unitários — a suíte inteira é E2E via [Cypress](https://www.cypress.io), rodando contra um app real e uma API real.

```bash
npm run test                                                                    # roda tudo (cypress run)
npx cypress open                                                                # modo interativo
npx cypress run --spec "cypress/e2e/itens/01-listagem-pesquisa-filtros.cy.ts"   # uma spec
```

Specs organizadas por domínio em `cypress/e2e/<dominio>/NN-descricao.cy.ts` — o prefixo numérico indica ordem lógica de fluxo (listagem → cadastro/edição → exclusão → casos específicos). Domínios cobertos: `itens`, `notificacoes`, `orcamentos`, `perfil`, `relatorios/{itens,movimentacoes,orcamentos}`, `usuarios`.

## Estrutura do projeto

```
estoque-inteligente-front/
├── src/
│   ├── app/
│   │   ├── (auth)/          # área logada: itens, fornecedores, emprestimos,
│   │   │                    # orcamentos, usuarios, perfil, relatorios
│   │   └── (no-auth)/       # login, cadastro, ativar-conta, esqueci-senha,
│   │                        # redefinir-senha
│   ├── middleware.ts        # gate de autenticação (valida sessão na API)
│   ├── lib/
│   │   ├── fetchData.ts     # client HTTP client-side (get/post/put/patch/del)
│   │   ├── serverFetch.ts   # client HTTP server-side (Server Components)
│   │   └── auth-client.ts   # cliente Better Auth
│   ├── hooks/                # use-session, use-permissions, useFormApiErrors...
│   ├── schemas/               # validação Zod por domínio
│   ├── types/                  # tipos de resposta da API por domínio
│   ├── components/
│   │   ├── ui/                  # shadcn/ui
│   │   └── modal-*.tsx           # modais de domínio (fora de subpastas)
│   ├── contexts/                  # ChatContext, SidebarContext
│   └── providers/                  # queryProvider (React Query)
├── cypress/
│   ├── e2e/<dominio>/NN-descricao.cy.ts
│   └── support/commands.ts, helpers.ts
├── components.json          # config shadcn/ui
├── Dockerfile
└── package.json
```

Cada rota de listagem segue o padrão `page.tsx` (Server Component, busca inicial via `serverFetch`) → `_components/*-client.tsx` (Client Component, React Query para refetch/mutations). Veja `CLAUDE.md` para detalhes de arquitetura.
