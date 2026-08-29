# Testing

Não há testes unitários. A suíte Cypress cobre só o fluxo de autenticação (`cypress/e2e/auth`) — o resto do sistema não tem E2E (decisão deliberada: E2E completo era lento e não era o foco do projeto; ver git log se precisar recuperar as specs removidas).

## Rodar

```bash
npm run test                                                # roda tudo (cypress run)
npx cypress open                                            # modo interativo
npx cypress run --spec "cypress/e2e/auth/01-login.cy.ts"    # uma spec
```

Requer o front rodando em `FRONTEND_URL` (padrão `http://localhost:3000`, ver `cypress.config.ts`) e variáveis de ambiente de teste (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `API_URL`) — ver `cypress.env.example.json`.

## Organização

Specs em `cypress/e2e/auth/NN-descricao.cy.ts` (login, esqueci-senha, redefinir-senha) — o prefixo numérico indica ordem lógica de fluxo, não uma ordem de execução obrigatória entre arquivos.

## Seletores

Testes localizam elementos por `[data-test="..."]`, via o comando custom `cy.getByData('seletor')` (`cypress/support/commands.ts`). Ao criar UI nova que precisa ser testada, adicionar `data-test="algo-descritivo"` no elemento — não depender de texto ou classes CSS para seleção.

## Escrevendo uma spec nova

Specs de auth não usam sessão cacheada nem fixtures via API — cada teste visita `/login` e interage com o form diretamente. Seguir esse padrão simples; não reintroduzir os comandos/helpers de domínio removidos (login via UI com `cy.session`, `loginViaAPI`, fixtures de item) a menos que a suíte volte a cobrir outros domínios.
