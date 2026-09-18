# Testing

Não há testes unitários (ver `CLAUDE.md`). A suíte Cypress cobre autenticação e todas as telas da área logada: `patrimonio`, `almoxarifado`, `categorias`, `localizacoes`, `emprestimos`, `fornecedores`, `usuarios`, `perfil`, `relatorios`.

## Rodar

```bash
# API de teste primeiro, em outro terminal (na pasta da API)
npm run test:server                                         # porta 3011, Mongo efêmero, seed automático

# Front em produção — nunca em dev (Next dev compila rota sob demanda e
# pode estourar o timeout do Cypress na primeira visita a cada rota)
npm run build && npm run start

# Suíte Cypress
npm run test                                                # roda tudo (cypress run)
npx cypress open                                            # modo interativo — funciona também contra a API de dev normal
npx cypress run --spec "cypress/e2e/patrimonio/*.cy.ts"     # uma pasta por vez durante o desenvolvimento
```

Variáveis de ambiente de teste em `cypress.env.json` (ver `cypress.env.example.json`): `FRONTEND_URL`, `API_URL` (aponta pra API de teste, porta `3011`, não a de dev), `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` (admin semeado) e `TEST_USER_COMUM_EMAIL`/`TEST_USER_COMUM_PASSWORD` (usuário sem permissão administrativa, semeado pela API para os cenários de RBAC).

## Organização

Specs em `cypress/e2e/<dominio>/NN-descricao.cy.ts` — o prefixo numérico indica ordem lógica de fluxo (listagem → cadastro/edição → exclusão → casos específicos), não uma ordem de execução obrigatória entre arquivos. Não existe spec de autocadastro: a rota `/cadastro` foi removida do sistema — ver nota em `CLAUDE.md`.

## Seletores

Testes localizam elementos por `[data-test="..."]`, via o comando custom `cy.getByData('seletor')` (`cypress/support/commands.ts`). Ao criar UI nova que precisa ser testada, adicionar `data-test="algo-descritivo"` no elemento — não depender de texto ou classes CSS para seleção. Vários modais (patrimônio, categoria, localização) não tinham `data-test` por campo até a suíte de E2E completa ser escrita — foram instrumentados junto; ao adicionar um modal novo, seguir o padrão `modal-<ação>-<entidade>`, `modal-<ação>-<entidade>-cancelar`/`-confirmar`, `<campo>-input`.

## Autenticação nas specs

`cy.login(email?, senha?)` (default: admin) faz login real via API (`cy.loginViaAPI`) dentro de um `cy.session` com `cacheAcrossSpecs: true` — uma autenticação por execução inteira, reaproveitada entre specs. Só `cypress/e2e/auth/01-login.cy.ts` loga pela UI de fato, porque é ela que testa o formulário de login. O `validate()` da sessão bate em `GET /api/auth/get-session`, não só confere o cookie — necessário porque a API de teste reseeda o banco a cada execução.

O rate limit do Better Auth (3 tentativas/10s) fica desligado na API de teste (`NODE_ENV=test`) — o cenário de 429 em `01-login.cy.ts` usa `cy.intercept` para simular a resposta, não provoca o limite de verdade.

## Massa de dados

`cypress/support/helpers.ts` tem uma fábrica por recurso (`criarCategoria`, `criarLocalizacao`, `criarItem`, `criarFornecedor`, `criarPatrimonio`, `criarMovimentacao`, `criarEmprestimo`, `convidarUsuario`, `criarNotificacao`), todas via `cy.api` (autenticado pela sessão de `cy.login`). Todo nome/valor criado em teste usa o prefixo `zz-<recurso>-` (`sufixoUnico`) — nunca reaproveitar ou mutar dado do seed. Exceção: o campo `nome` de usuário tem validação de capitalização estrita no formulário (zod) — usar um nome fixo válido como `"Zz Usuario Teste"` na UI, deixando a unicidade por conta do e-mail.

Specs nunca afirmam contagem absoluta (`totalDocs`/tamanho de lista) — sempre filtram pelo item criado em teste antes de asserir, porque o soft-delete (`inativar`) não remove registros e a API de teste pode acumular dado entre execuções manuais.

## Padrões de UI a conhecer antes de escrever uma spec nova

- **Radix/shadcn**: `Select` renderiza opções em portal — usar `cy.get('[role="option"]')` direto na página, nunca `.within()` do dialog. `Dialog`/`DropdownMenu` mantêm `pointer-events: none` no body durante a animação de abertura — se um clique falhar por "elemento não clicável", usar `{ force: true }` e esperar o dialog sumir (`cy.get('[role="dialog"]').should('not.exist')`) em vez de `cy.wait`.
- **Campo de busca controlado + `nuqs`**: evitar `.clear().type()` num `search-input` já preenchido — o valor pode voltar do estado sincronizado com a URL antes do `.type()` completar, corrompendo o texto digitado. Prefira não re-tocar um filtro já aplicado, ou confirmar `.should('have.value', '')` antes de digitar de novo.
- **Toggle de visualização (grid/tabela)**: componentes `ViewModeToggle` expõem dois botões (`<dataTest>-cards`/`<dataTest>-table`), não um botão único que alterna — cada domínio usa seu próprio `data-test` base (`patrimonio-view-toggle`, `almoxarifado-view-toggle`).
- **Ações por dropdown**: o trigger costuma ter um `data-test` fixo por linha/card, mas em telas com grid e tabela (ex.: almoxarifado) o trigger muda de nome conforme a visualização ativa (`actions-menu-button` no card, `item-row-acoes-<index>` na tabela).

## Escrevendo uma spec nova

Seguir o padrão dos domínios já cobertos (ver `documentacao/suites-de-teste/`): `beforeEach` com `cy.login()`, massa de dados via fábrica de `cypress/support/helpers.ts`, navegação via `cy.irPara(rota, marcadorPagina)`, interação só por `data-test`. Rodar a spec nova pelo menos duas vezes seguidas contra a API de teste (`npm run test:server`) antes de considerar pronta — idempotência é parte do contrato, dado que não há teardown entre specs.
