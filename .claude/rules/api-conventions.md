# API conventions

Este repositório é só o frontend. A API é um serviço externo separado (Node/Mongo), acessada via HTTP com cookie de sessão (Better Auth).

## Formato de resposta

Toda resposta da API segue o envelope:

```json
{
  "error": false,
  "code": 200,
  "message": "...",
  "data": { "docs": [...], "totalDocs": 0, "limit": 15, "totalPages": 0, "page": 1, "pagingCounter": 1, "hasPrevPage": false, "hasNextPage": false, "prevPage": null, "nextPage": null },
  "errors": []
}
```

Paginação estilo mongoose-paginate. Erros de validação de formulário vêm em `errors: [{ path, message }]` — usar `useFormApiErrors` (`src/hooks/useFormApiErrors.ts`) para mapear pro `react-hook-form`.

## Tipos de entidade

Os tipos em `src/types/*.ts` espelham o schema Mongo bruto: `_id`, `__v`, `snake_case` em alguns campos (ex.: `estoque_minimo`, `ativo`), populações aninhadas em vez de IDs soltos. Ao criar um tipo novo para uma entidade da API, seguir esse espelhamento em vez de normalizar para camelCase — não inventar um DTO paralelo.

Atenção: os schemas Zod de formulário (`src/schemas/*.schema.ts`) usam camelCase (`estoqueMinimo`) porque validam o que o usuário digita, enquanto o tipo de resposta da API (`src/types/itens.ts`) usa `estoque_minimo`. Essa divergência é esperada — não "corrigir" um pelo outro sem checar os dois lados.

## Client HTTP

- **Client-side**: `get/post/put/patch/del` de `src/lib/fetchData.ts`. Sempre `credentials: 'include'`, sempre prefixado com `NEXT_PUBLIC_API_URL`. Em 401/498 faz signOut e redireciona pra `/login` sozinho — não duplicar esse tratamento em chamadas individuais.
- **Server-side** (dentro de Server Components): `serverFetch` de `src/lib/serverFetch.ts`. Propaga o cookie via `next/headers`, usa `cache: 'no-store'`, retorna `null` em qualquer falha (nunca lança). Tratar `null` como "sem dados iniciais", não como erro fatal.
- Nunca chamar `fetch` direto pra API nas páginas/componentes — sempre passar por um desses dois.

## Permissões

`usePermissions()` (`src/hooks/use-permissions.ts`) busca `GET /usuarios/:id` e expõe `hasPermission(rota, action?)` com ações `'buscar' | 'enviar' | 'substituir' | 'modificar' | 'excluir'`. Esse vocabulário vem da API — não inventar novas ações sem confirmar que a API as reconhece.
