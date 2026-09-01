# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

Frontend em Next.js 15 (App Router, React 19, TypeScript) do sistema "Estoque Inteligente" — TCC de gestão de estoque com itens, fornecedores, empréstimos, orçamentos, usuários e relatórios. Consome uma API externa separada (não está neste repositório) via HTTP, com autenticação via Better Auth (cookie de sessão).

## Comandos

```bash
npm run dev          # servidor de desenvolvimento (Turbopack)
npm run build         # build de produção (Turbopack)
npm run start          # servidor de produção
npm run lint            # ESLint
npm run lint:fix         # ESLint com correção automática
npm run format            # Prettier — formata tudo
npm run format:check       # Prettier — apenas verifica
npm run fix                 # lint:fix + format em sequência
npm run test                 # Cypress E2E (cypress run)
```

Não há testes unitários configurados. A suíte E2E via Cypress (`cypress/e2e`) cobre só o fluxo de autenticação (`cypress/e2e/auth`) — decisão deliberada, E2E completo era lento e não era o foco do projeto. Para rodar Cypress em modo interativo, use `npx cypress open`. Para rodar uma única spec: `npx cypress run --spec "cypress/e2e/auth/01-login.cy.ts"`.

Variáveis de ambiente (ver `.env.example`): `NEXT_PUBLIC_API_URL` (chamadas client-side) e `API_URL` (chamadas server-side/SSR — no Docker aponta para o nome do serviço da API, não `localhost`).

## Arquitetura

### Roteamento e autenticação

- App Router com dois grupos de rotas: `src/app/(auth)/*` (área logada: itens, fornecedores, emprestimos, orcamentos, usuarios, perfil, relatorios) e `src/app/(no-auth)/*` (login, ativar-conta, esqueci-senha, redefinir-senha). Não existe autocadastro público — `/cadastro` foi removida (chamava um endpoint `/signup` que nunca existiu na API, e mesmo funcional criaria usuário sem grupo/permissão, fora do fluxo de convite via admin). Onboarding de usuário é sempre `POST /usuarios` pelo admin seguido de `/ativar-conta?token=...`.
- `src/middleware.ts` faz o gate de autenticação em toda navegação: encaminha o cookie da requisição para `${API_URL}/api/auth/get-session` e redireciona para `/login` (rotas privadas sem sessão) ou para `/bens/patrimonio` (rotas só-visitante já autenticado). Listas hardcoded em `PUBLIC_ROUTES`/`GUEST_ONLY_ROUTES`.
- Autenticação de fato é feita pelo Better Auth (`src/lib/auth-client.ts`), com campos extras de usuário (`ativo`, `fotoPerfil`) injetados via plugin `inferAdditionalFields`.
- `src/hooks/use-session.ts` expõe `useSession()` (client-side, wrapper de `authClient.useSession()`) — usar em vez de acessar `authClient` diretamente em componentes.
- `src/hooks/use-permissions.ts` expõe `usePermissions()`, que busca as permissões do usuário (`GET /usuarios/:id`) e oferece `hasPermission(rota, action?)`, `isAdmin()`, `canManageUsers()`. Ações de permissão seguem o vocabulário da API: `'buscar' | 'enviar' | 'substituir' | 'modificar' | 'excluir'`.

### Padrão de página: server fetch + client component

Cada rota de listagem segue o mesmo padrão:

- `page.tsx` (Server Component) busca os dados iniciais via `serverFetch` (`src/lib/serverFetch.ts`, que propaga o cookie da requisição e usa `cache: 'no-store'`) e passa como `initialData` para um componente client dentro de `_components/*-client.tsx`.
- O componente client (`'use client'`) usa React Query para refetch/mutations subsequentes, mantendo `initialData` como estado inicial.
- Exemplo: `src/app/(auth)/itens/page.tsx` → `src/app/(auth)/itens/_components/itens-client.tsx`.

Ao adicionar uma nova página de listagem, siga esse mesmo padrão em vez de buscar tudo client-side.

### Camada de dados

- `src/lib/fetchData.ts` é o client HTTP client-side único: exporta `get/post/put/patch/del`, todos usando `fetchData()` por baixo. Sempre inclui `credentials: 'include'` (cookie de sessão) e prefixa `NEXT_PUBLIC_API_URL`. Em erro 401/498 faz signOut e redireciona para `/login` automaticamente — não duplicar esse tratamento em chamadas individuais.
- `src/lib/serverFetch.ts` é o equivalente server-side (usado dentro de Server Components), propaga o cookie via `next/headers` e retorna `null` em qualquer falha (sem lançar).
- Não existe uma pasta central "API modules" — cada domínio tem seu schema em `src/schemas/*.schema.ts` (validação Zod + tipos de formulário via `z.infer`) e seus tipos de resposta de API em `src/types/*.ts`. As respostas da API seguem o formato `{ error, code, message, data: { docs, totalDocs, limit, totalPages, page, ... }, errors }` (paginação estilo mongoose-paginate).
- Os tipos de entidade espelham o schema Mongo da API (`_id`, `__v`, populações aninhadas) — ao criar novos tipos, siga essa convenção em vez de normalizar para camelCase puro.

### Estado, forms e dados remotos

- React Query (`@tanstack/react-query`) via `src/providers/queryProvider.tsx` é o mecanismo padrão de cache/fetch de dados remotos. Devtools inclusas em dev.
- `nuqs` é usado para estado sincronizado com a URL (filtros, paginação) nas páginas de listagem.
- Formulários usam `react-hook-form` + `@hookform/resolvers` + schemas Zod de `src/schemas/`. `src/hooks/useFormApiErrors.ts` faz o mapeamento de erros de validação vindos da API para os campos do form.
- Contextos globais em `src/contexts/`: `ChatContext` (widget de chat, só usado dentro de `(auth)`) e `SidebarContext`.

### UI

- Componentes shadcn/ui (`style: new-york`, base color `neutral`) em `src/components/ui/`, gerados/configurados via `components.json`. Ícones via `lucide-react`.
- Colocation por rota: componente usado por uma única rota mora no `_components/` dessa rota (ex. `src/app/(auth)/fornecedores/_components/modal-cadastrar-fornecedor.tsx`), seguindo o mesmo padrão já usado pelos `*-client.tsx`. `src/components/` guarda só o que é compartilhado por 2+ rotas, agrupado por domínio: `layout/` (chrome do app), `comum/` (genéricos cross-domínio), `item-form/`, `categoria/`, `localizacao/`, `emprestimo/` (compartilhados entre fluxos de item e patrimônio), além de `ui/` e `chat/`.
- Alias de import `@/*` → `src/*` (configurado em `tsconfig.json` e `components.json`).
- Tailwind v4 (config em `tailwind.config.js` + `postcss.config.mjs`, sem arquivo de tema separado — cores usam CSS variables em `globals.css`).

### Testes E2E (Cypress)

- Specs só de autenticação, em `cypress/e2e/auth/NN-descricao.cy.ts` (login, esqueci-senha, redefinir-senha, ativar-conta). Numeração de prefixo indica ordem lógica de fluxo, não ordem de execução obrigatória.
- Comando customizado único em `cypress/support/commands.ts` (`cy.getByData`).
- `cypress.config.ts` usa `FRONTEND_URL` (env do Cypress) como `baseUrl`, com fallback para `http://localhost:3000` — o app precisa estar rodando (`npm run dev` ou build) antes de `npm run test`.

## Convenções de código

- Todo texto de UI, mensagens de erro e nomes de domínio (rotas, componentes, variáveis de negócio) estão em português (pt-BR) — manter esse padrão em código novo.
- Prettier: aspas simples, ponto e vírgula obrigatório, trailing comma em tudo, `arrowParens: always`. Rodar `npm run fix` antes de finalizar mudanças.
- ESLint: `unused-imports` remove imports não usados automaticamente; `no-explicit-any` e `no-console` (exceto `warn`/`error`) são apenas warnings, não erros — evite introduzir novos, mas não é bloqueante.
