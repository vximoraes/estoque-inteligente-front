# Suite de Testes E2E — Empréstimos (`/emprestimos`)

Testes E2E (UI) que validam listagem, filtros, cadastro, devolução, edição e exclusão de empréstimos por quantidade (itens de consumo).

Arquivos: `cypress/e2e/emprestimos/{01-listagem-filtros,02-cadastro,03-devolucao-edicao-exclusao}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                          | Comportamento Atual do Sistema                                                          | Impacto na Suite E2E                                                        |
| :----------------------------- | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| Duas abas por tipo de controle | A tela abre por padrão na aba "Unidade" (patrimônio); esta suíte cobre só "Quantidade". | Toda spec clica `emprestimos-tab-quantidade` antes de buscar/agir.          |
| Localização depende de estoque | O dropdown de localização do cadastro só lista onde o item selecionado tem estoque > 0. | A massa de teste sempre gera uma movimentação de entrada antes do cadastro. |
| Exclusão exige devolução total | Só é possível excluir um empréstimo já totalmente devolvido (mesma regra da API).       | Specs de exclusão sempre devolvem a quantidade total antes de excluir.      |

## Massa de Dados Recomendada

| Entidade                                     | Objetivo nos testes                                               |
| :------------------------------------------- | :---------------------------------------------------------------- |
| Item + localização + movimentação de entrada | Pré-requisito de empréstimo por quantidade (`criarMovimentacao`). |
| Empréstimo criado em teste                   | `solicitante_nome` prefixado `zz-solicitante-`.                   |

## Pré-condições Técnicas da Suite

| Etapa        | Objetivo                                | Critério                                    |
| :----------- | :-------------------------------------- | :------------------------------------------ |
| `cy.login()` | Autenticar como admin, sessão cacheada. | Sessão válida confirmada via `get-session`. |

## Listagem e filtros

| Funcionalidade                    | Comportamento Esperado             | Verificações                                               | Critérios de Aceite           |
| :-------------------------------- | :--------------------------------- | :--------------------------------------------------------- | :---------------------------- |
| **Cenários felizes**              |                                    |                                                            |                               |
| Buscar empréstimo por solicitante | Deve retornar o empréstimo criado. | Trocar para a aba "Quantidade", digitar em `search-input`. | Empréstimo aparece na tabela. |

## Cadastro

| Funcionalidade                 | Comportamento Esperado                                                              | Verificações                                                                             | Critérios de Aceite                           |
| :----------------------------- | :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :-------------------------------------------- |
| **Cenários felizes**           |                                                                                     |                                                                                          |                                               |
| Cadastro válido por quantidade | Deve criar o empréstimo com item, localização, quantidade e solicitante informados. | Selecionar item e localização nos dropdowns, preencher quantidade e solicitante, salvar. | Empréstimo aparece na busca pelo solicitante. |

## Devolução, edição e exclusão

| Funcionalidade               | Comportamento Esperado                             | Verificações                                                          | Critérios de Aceite                |
| :--------------------------- | :------------------------------------------------- | :-------------------------------------------------------------------- | :--------------------------------- |
| **Cenários felizes**         |                                                    |                                                                       |                                    |
| Devolução parcial            | Deve fechar o modal de devolução com sucesso.      | Ação "Devolver", preencher quantidade menor que o total, confirmar.   | `modal-devolver-item` fecha.       |
| Editar observações           | Deve permitir alterar o solicitante do empréstimo. | Ação "Editar", alterar `modal-editar-emprestimo-solicitante`, salvar. | Novo solicitante aparece na busca. |
| Excluir após devolução total | Deve remover o empréstimo da listagem.             | Devolver a quantidade total, depois ação "Excluir", confirmar.        | Empréstimo some da busca.          |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                                                                                                        |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| Seleção por `data-test` | Toda interação usa `cy.getByData`.                                                                                                     |
| Massa de dados          | Todo `solicitante_nome` de teste usa prefixo `zz-solicitante-` único (não reaproveitar nome fixo — colide entre casos da mesma suíte). |

## Estratégia de Organização dos Testes E2E

| Bloco                                | Objetivo                                                 |
| :----------------------------------- | :------------------------------------------------------- |
| `01-listagem-filtros.cy.ts`          | Busca na aba de empréstimos por quantidade.              |
| `02-cadastro.cy.ts`                  | Cadastro completo via dropdowns de item/localização.     |
| `03-devolucao-edicao-exclusao.cy.ts` | Devolução parcial, edição, exclusão pós-devolução total. |

## Variáveis de Ambiente Usadas

| Variável       | Uso na suite                     |
| :------------- | :------------------------------- |
| `FRONTEND_URL` | Base para navegação.             |
| `API_URL`      | Base para fábricas via `cy.api`. |

## Observações de Implementação para os Casos E2E

| Ponto                                 | Diretriz                                                                                                                           |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| `item`/`localizacao` populados na API | `POST /movimentacoes` retorna esses campos como objetos (não ids) — a fábrica `criarEmprestimo` já extrai `_id` antes de reenviar. |
| Nome de solicitante único             | O valor default da fábrica `criarEmprestimo` é único por chamada — nunca usar um nome fixo entre `it()` da mesma suíte.            |
