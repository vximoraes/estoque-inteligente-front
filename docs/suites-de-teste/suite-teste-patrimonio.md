# Suite de Testes E2E — Patrimônio (`/bens/patrimonio`)

Testes E2E (UI) que validam listagem, busca, filtros, cadastro, edição, remoção, transição de status e transferência de localização de unidades de patrimônio.

Arquivos: `cypress/e2e/patrimonio/{01-listagem-busca-filtros,02-cadastro-edicao,03-status-transferencia}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                         | Comportamento Atual do Sistema                                                                               | Impacto na Suite E2E                                                          |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| Listagem paginada e ordenada  | Itens ordenam por `numero_patrimonio` — dado de teste prefixado `zz-` cai fora da primeira página.           | Toda spec busca pelo nome/número criado antes de asserir visibilidade.        |
| `numero_patrimonio` maiúsculo | O Model salva sempre em maiúsculas.                                                                          | Asserções de texto usam `.toUpperCase()` quando o valor vem do próprio teste. |
| Dois modos de visualização    | Grid (`patrimonio-grid`) e tabela (`patrimonio-table`), alternados por botões dedicados.                     | Toggle usa `patrimonio-view-toggle-cards`/`-table`, não um clique único.      |
| Ações por dropdown            | Editar/Emprestar/Manutenção/Transferir/Remover ficam num menu por unidade (`patrimonio-card-acoes-trigger`). | Cada ação tem `data-test` próprio (`patrimonio-acao-<ação>`).                 |

## Massa de Dados Recomendada

| Entidade                                   | Objetivo nos testes                                               |
| :----------------------------------------- | :---------------------------------------------------------------- |
| Categoria de tipo permanente e localização | Pré-requisitos de cadastro (`criarCategoria`/`criarLocalizacao`). |
| Patrimônio criado em teste                 | `numero_patrimonio` prefixado `zz-patrimonio-`.                   |

## Pré-condições Técnicas da Suite

| Etapa        | Objetivo                                | Critério                                              |
| :----------- | :-------------------------------------- | :---------------------------------------------------- |
| `cy.login()` | Autenticar como admin, sessão cacheada. | Cookie de sessão válido confirmado via `get-session`. |

## Listagem, busca e filtros

| Funcionalidade                  | Comportamento Esperado                           | Verificações                                             | Critérios de Aceite                            |
| :------------------------------ | :----------------------------------------------- | :------------------------------------------------------- | :--------------------------------------------- |
| **Cenários felizes**            |                                                  |                                                          |                                                |
| Buscar por número de patrimônio | Deve retornar a unidade criada em teste.         | Digitar em `search-input`.                               | Unidade aparece na lista.                      |
| Alternar grid/tabela            | Deve trocar a visualização mantendo os dados.    | Clicar `patrimonio-view-toggle-table` e depois `-cards`. | `patrimonio-table`/`patrimonio-grid` visíveis. |
| Filtrar por localização         | Deve restringir a lista à localização escolhida. | Selecionar em `filtro-localizacao`.                      | Unidade da localização escolhida aparece.      |

## Cadastro e edição

| Funcionalidade                    | Comportamento Esperado                                                       | Verificações                                                                                     | Critérios de Aceite                               |
| :-------------------------------- | :--------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| **Cenários felizes**              |                                                                              |                                                                                                  |                                                   |
| Cadastro válido                   | Deve criar a unidade com número, modelo, categoria e localização informados. | Preencher `numero-patrimonio-input`/`modelo-input`, selecionar categoria/localização, confirmar. | Unidade aparece na busca pelo número informado.   |
| Editar modelo                     | Deve atualizar o modelo exibido.                                             | Abrir edição via dropdown, alterar `modelo-input`, salvar.                                       | Novo modelo aparece na listagem.                  |
| Remover unidade                   | Deve remover (soft-delete) a unidade da listagem.                            | Ação "Remover" no dropdown, confirmar.                                                           | Unidade some da busca por número.                 |
| **Cenários tristes**              |                                                                              |                                                                                                  |                                                   |
| Cadastro sem número de patrimônio | Deve manter o modal aberto com erro de campo obrigatório.                    | Confirmar cadastro com campos vazios.                                                            | Modal continua visível, mensagem de erro exibida. |

## Transição de status e transferência

| Funcionalidade                    | Comportamento Esperado                                 | Verificações                                               | Critérios de Aceite                               |
| :-------------------------------- | :----------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------ |
| **Cenários felizes**              |                                                        |                                                            |                                                   |
| Enviar para manutenção            | Deve mudar o status exibido no card para "Manutenção". | Ação "Manutenção" no dropdown, confirmar no modal.         | `patrimonio-card-status` contém "Manutenção".     |
| Transferir para outra localização | Deve atualizar a localização exibida no card.          | Ação "Transferir", selecionar nova localização, confirmar. | `patrimonio-card-localizacao` contém o novo nome. |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                                                         |
| :---------------------- | :-------------------------------------------------------------------------------------- |
| Seleção por `data-test` | Toda interação usa `cy.getByData`, sem depender de texto/classe.                        |
| Massa de dados          | Toda unidade/categoria/localização criada em teste usa prefixo `zz-`.                   |
| Idempotência            | Specs não afirmam contagem absoluta — sempre filtram pelo item criado antes de asserir. |

## Estratégia de Organização dos Testes E2E

| Bloco                             | Objetivo                                                    |
| :-------------------------------- | :---------------------------------------------------------- |
| `01-listagem-busca-filtros.cy.ts` | Busca, alternância de visualização, filtro por localização. |
| `02-cadastro-edicao.cy.ts`        | Cadastro válido/inválido, edição, remoção.                  |
| `03-status-transferencia.cy.ts`   | Transição de status, transferência de localização.          |

## Variáveis de Ambiente Usadas

| Variável       | Uso na suite                                 |
| :------------- | :------------------------------------------- |
| `FRONTEND_URL` | Base para `cy.visit`/`cy.irPara`.            |
| `API_URL`      | Base para as fábricas de dados via `cy.api`. |

## Observações de Implementação para os Casos E2E

| Ponto                                | Diretriz                                                                                                                                                           |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-test` adicionado nesta entrega | Os modais de patrimônio (cadastrar/editar/remover/status/transferir) e o dropdown de ações não tinham `data-test` por campo — instrumentados junto com esta suíte. |
| `.clear()` em campo de busca         | Evitar `.clear().type()` num campo já preenchido e sincronizado com a URL — prefira reusar o filtro já aplicado.                                                   |
