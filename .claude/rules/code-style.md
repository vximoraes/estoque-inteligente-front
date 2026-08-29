# Code style

- Todo texto de UI, mensagens de erro, nomes de rotas e variáveis de negócio ficam em português (pt-BR). Não traduzir para inglês.
- Formatação via Prettier (`.prettierrc`): aspas simples, ponto e vírgula obrigatório, trailing comma em tudo, `arrowParens: always`. Rodar `npm run fix` antes de considerar uma mudança pronta.
- ESLint remove imports não usados automaticamente (`unused-imports`). `no-explicit-any` e `no-console` (exceto `warn`/`error`) são warnings, não erros — evitar introduzir novos, mas não travam o build.
- Alias de import `@/*` aponta para `src/*` — sempre usar o alias em vez de caminhos relativos longos (`../../../`).
- Componentes shadcn/ui (`style: new-york`) ficam em `src/components/ui/`; não editar à mão sem necessidade — preferir regenerar via CLI do shadcn quando possível.
- Modais de domínio ficam soltos em `src/components/modal-*.tsx` (não em subpastas por domínio), seguindo o padrão `modal-<ação>-<entidade>.tsx` (ex.: `modal-excluir-item.tsx`, `modal-editar-emprestimo.tsx`).
- Elementos que testes Cypress precisam localizar levam `data-test="..."`. Nenhum componente usa `data-testid` — não introduzir esse padrão.
