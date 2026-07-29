# Testing

Não há testes unitários — a suíte inteira é E2E via Cypress, rodando contra um app real (`npm run dev`/build) e uma API real.

## Rodar

```bash
npm run test                                                           # roda tudo (cypress run)
npx cypress open                                                       # modo interativo
npx cypress run --spec "cypress/e2e/itens/01-listagem-pesquisa-filtros.cy.ts"   # uma spec
```

Requer o front rodando em `FRONTEND_URL` (padrão `http://localhost:3000`, ver `cypress.config.ts`) e variáveis de ambiente de teste (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `API_URL`) — ver `cypress.env.example.json`.

## Organização

Specs em `cypress/e2e/<dominio>/NN-descricao.cy.ts` — o prefixo numérico indica ordem lógica de fluxo dentro do domínio (listagem → cadastro/edição → exclusão → casos específicos), não uma ordem de execução obrigatória entre arquivos.

Domínios existentes: `itens`, `notificacoes`, `orcamentos`, `perfil`, `relatorios/{itens,movimentacoes,orcamentos}`, `usuarios`.

## Seletores

Testes localizam elementos por `[data-test="..."]`, via o comando custom `cy.getByData('seletor')` (`cypress/support/commands.ts`). Ao criar UI nova que precisa ser testada, adicionar `data-test="algo-descritivo"` no elemento — não depender de texto ou classes CSS para seleção.

## Comandos custom relevantes

- `cy.login(email, senha)` — login via UI, espera redirecionar pra `/itens`. Usado nos `beforeEach()`.
- `cy.loginViaAPI(email, senha)` — faz `POST /api/auth/sign-in/email` direto (Better Auth); existe em `commands.ts` mas hoje nenhuma spec chama ela. As specs que precisam de fixtures via API fazem o próprio `cy.request` inline (ver abaixo), não essa command — se for escrever uma spec nova que precise disso, prefira `cy.loginViaAPI` em vez de duplicar o `cy.request` de login mais uma vez.
- `cy.waitForItens()` — espera intercept `@getComponentes` (precisa ter sido registrado com `cy.intercept('GET', '**/itens*').as('getComponentes')` antes).
- `cy.clearAllFilters()` — limpa filtros ativos na tela.

## Sessão via API dentro de uma spec (`before()`/`after()`)

Várias specs (`itens/01,02,03`, `orcamentos/01,02,03,04`) fazem login direto por `cy.request` pra buscar fixtures reais (primeiro item/categoria/orçamento existente) ou pra limpar dado de teste no `after()`:

```ts
cy.request({
  method: 'POST',
  url: `${apiUrl}/api/auth/sign-in/email`,
  body: { email, password: senha },
}).then((response) => {
  const token = response.body.token; // Better Auth (plugin bearer) devolve o token no body
  // ...
});
```

Better Auth é cookie-based: o `Set-Cookie` da resposta já autentica qualquer `cy.request()` seguinte pro mesmo domínio (Cypress reenvia cookies automaticamente), sem precisar do header `Authorization`. Ele só é necessário quando o teste roda checks de API *fora* da sequência de um `cy.login()`/`cy.request` de sessão já feito antes — nesse caso, usar o `token` do body da resposta, nunca ler de `localStorage` (o app não guarda token nenhum lá; isso já foi causa de testes quebrados no passado).

## Escrevendo uma spec nova

Seguir o padrão observado em specs existentes: `before()` faz login via API e busca dados de referência (ex. primeiro item/categoria) direto na API pra ter fixtures reais; `beforeEach()` registra intercepts, faz login via UI, e espera a página carregar (`cy.get('[data-test="<pagina>-page"]')`) antes de cada teste.
