# Suite de Testes E2E — Almoxarifado (`/bens/almoxarifado`)

Testes E2E (UI) que validam listagem, busca, cadastro, edição, exclusão de itens de consumo e o registro de entrada/saída de estoque por localização.

Arquivos: `cypress/e2e/almoxarifado/{01-listagem-busca,02-cadastro-edicao-exclusao,03-entrada-saida}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                             | Comportamento Atual do Sistema                                                                                                                                           | Impacto na Suite E2E                                                                 |
| :-------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| Ações dependem da visualização    | O trigger de ações (editar/emprestar/excluir) chama-se `actions-menu-button` na visualização em cards e `item-row-acoes-<index>` na tabela — são componentes diferentes. | Specs usam `actions-menu-button` por padrão (grid é a visão default).                |
| Saída exige estoque               | O ícone de saída fica desabilitado quando `quantidade === 0`.                                                                                                            | Specs de saída sempre fazem uma entrada antes.                                       |
| Entrada/saída são por localização | Cada movimentação exige selecionar uma localização com o dropdown próprio do modal.                                                                                      | Seleção usa `modal-entrada-localizacao-dropdown`/`modal-saida-localizacao-dropdown`. |

## Massa de Dados Recomendada

| Entidade                        | Objetivo nos testes                      |
| :------------------------------ | :--------------------------------------- |
| Categoria de tipo consumo       | Pré-requisito de cadastro de item.       |
| Item de consumo criado em teste | Nome prefixado `zz-item-`.               |
| Localização criada em teste     | Alvo das movimentações de entrada/saída. |

## Pré-condições Técnicas da Suite

| Etapa        | Objetivo                                | Critério                                    |
| :----------- | :-------------------------------------- | :------------------------------------------ |
| `cy.login()` | Autenticar como admin, sessão cacheada. | Sessão válida confirmada via `get-session`. |

## Listagem e busca

| Funcionalidade       | Comportamento Esperado                | Verificações                                      | Critérios de Aceite                    |
| :------------------- | :------------------------------------ | :------------------------------------------------ | :------------------------------------- |
| **Cenários felizes** |                                       |                                                   |                                        |
| Buscar item por nome | Deve retornar o item criado em teste. | Digitar em `search-input`.                        | Item aparece na lista.                 |
| Alternar grid/tabela | Deve trocar a visualização.           | Clicar `almoxarifado-view-toggle-table`/`-cards`. | `almoxarifado-table`/`-grid` visíveis. |

## Cadastro, edição e exclusão

| Funcionalidade          | Comportamento Esperado                                  | Verificações                                                                       | Critérios de Aceite                              |
| :---------------------- | :------------------------------------------------------ | :--------------------------------------------------------------------------------- | :----------------------------------------------- |
| **Cenários felizes**    |                                                         |                                                                                    |                                                  |
| Cadastro de item válido | Deve criar o item com nome, categoria e estoque mínimo. | Preencher `input-nome-item`, selecionar categoria, `input-estoque-minimo`, salvar. | Item aparece na busca.                           |
| Editar nome do item     | Deve atualizar o nome exibido.                          | Ação "Editar" no menu, alterar `input-nome-item`, salvar.                          | Novo nome aparece na busca.                      |
| Excluir item            | Deve remover o item da listagem.                        | Ação "Excluir" no menu, confirmar.                                                 | Item some da busca.                              |
| **Cenários tristes**    |                                                         |                                                                                    |                                                  |
| Cadastro sem nome       | Deve manter o modal aberto.                             | Confirmar cadastro com campos vazios.                                              | `modal-cadastrar-item-consumo` continua visível. |

## Entrada e saída de estoque

| Funcionalidade               | Comportamento Esperado                                | Verificações                                                              | Critérios de Aceite            |
| :--------------------------- | :---------------------------------------------------- | :------------------------------------------------------------------------ | :----------------------------- |
| **Cenários felizes**         |                                                       |                                                                           |                                |
| Registrar entrada            | Deve abrir e fechar o modal de entrada com sucesso.   | Ícone "entrada", preencher quantidade, selecionar localização, confirmar. | `modal-entrada-content` fecha. |
| Registrar saída após entrada | Deve permitir saída quando há estoque na localização. | Entrada seguida de ícone "saída", preencher quantidade, confirmar.        | `modal-saida-content` fecha.   |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                                      |
| :---------------------- | :------------------------------------------------------------------- |
| Seleção por `data-test` | Toda interação usa `cy.getByData`.                                   |
| Massa de dados          | Item/categoria/localização de teste sempre prefixados `zz-`.         |
| Dependência de estoque  | Nenhuma spec assume estoque pré-existente — sempre cria via entrada. |

## Estratégia de Organização dos Testes E2E

| Bloco                               | Objetivo                                 |
| :---------------------------------- | :--------------------------------------- |
| `01-listagem-busca.cy.ts`           | Busca e alternância de visualização.     |
| `02-cadastro-edicao-exclusao.cy.ts` | CRUD de item de consumo.                 |
| `03-entrada-saida.cy.ts`            | Movimentação de estoque por localização. |

## Variáveis de Ambiente Usadas

| Variável       | Uso na suite                              |
| :------------- | :---------------------------------------- |
| `FRONTEND_URL` | Base para navegação.                      |
| `API_URL`      | Base para fábricas de dados via `cy.api`. |

## Observações de Implementação para os Casos E2E

| Ponto                                | Diretriz                                                                                                                                          |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dois triggers de ação                | `actions-menu-button` (cards) e `item-row-acoes-<index>` (tabela) não são intercambiáveis — checar qual visualização está ativa.                  |
| Localização sem `data-test` na opção | O dropdown de localização do modal de entrada/saída não tem `data-test` por opção — seleção usa `cy.contains(nome)` dentro do dropdown já aberto. |
