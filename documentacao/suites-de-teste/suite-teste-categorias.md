# Suite de Testes E2E — Categorias (`/categorias`)

Testes E2E (UI) que validam listagem, busca, cadastro, edição e exclusão de categorias, incluindo a alternância entre os tipos permanente e consumo.

Arquivos: `cypress/e2e/categorias/{01-listagem-busca,02-cadastro-edicao-exclusao}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                            | Comportamento Atual do Sistema                                                               | Impacto na Suite E2E                                                 |
| :------------------------------- | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| Duas abas por tipo               | A tela abre por padrão na aba "Permanente"; consumo é uma aba separada.                      | Specs de consumo clicam `categorias-tab-consumo` explicitamente.     |
| Filtro de busca reseta ao editar | Renomear uma categoria não atualiza sozinho o filtro de busca já aplicado com o nome antigo. | Após editar, a spec busca novamente pelo nome novo antes de asserir. |

## Massa de Dados Recomendada

| Entidade                  | Objetivo nos testes                                   |
| :------------------------ | :---------------------------------------------------- |
| Categoria criada em teste | Nome prefixado `zz-categoria-`, tipo conforme o caso. |

## Pré-condições Técnicas da Suite

| Etapa        | Objetivo                                | Critério                                    |
| :----------- | :-------------------------------------- | :------------------------------------------ |
| `cy.login()` | Autenticar como admin, sessão cacheada. | Sessão válida confirmada via `get-session`. |

## Listagem e busca

| Funcionalidade                           | Comportamento Esperado             | Verificações                                 | Critérios de Aceite           |
| :--------------------------------------- | :--------------------------------- | :------------------------------------------- | :---------------------------- |
| **Cenários felizes**                     |                                    |                                              |                               |
| Buscar categoria permanente (aba padrão) | Deve retornar a categoria criada.  | Digitar em `search-input` sem trocar de aba. | Categoria aparece na tabela.  |
| Trocar para aba consumo e buscar         | Deve listar categorias de consumo. | Clicar `categorias-tab-consumo`, buscar.     | Categoria de consumo aparece. |

## Cadastro, edição e exclusão

| Funcionalidade       | Comportamento Esperado                | Verificações                                           | Critérios de Aceite                           |
| :------------------- | :------------------------------------ | :----------------------------------------------------- | :-------------------------------------------- |
| **Cenários felizes** |                                       |                                                        |                                               |
| Cadastro válido      | Deve criar a categoria permanente.    | Preencher `nome-input`, confirmar.                     | Categoria aparece na busca.                   |
| Editar nome          | Deve atualizar o nome exibido.        | Ação de editar na linha, alterar `nome-input`, salvar. | Novo nome aparece na busca pelo novo nome.    |
| Excluir categoria    | Deve remover a categoria da listagem. | Ação de excluir na linha, confirmar.                   | Categoria some da busca.                      |
| **Cenários tristes** |                                       |                                                        |                                               |
| Cadastro sem nome    | Deve manter o modal aberto.           | Confirmar cadastro com campo vazio.                    | `modal-cadastrar-categoria` continua visível. |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                      |
| :---------------------- | :--------------------------------------------------- |
| Seleção por `data-test` | Toda interação usa `cy.getByData`.                   |
| Massa de dados          | Toda categoria de teste usa prefixo `zz-categoria-`. |

## Estratégia de Organização dos Testes E2E

| Bloco                               | Objetivo                                |
| :---------------------------------- | :-------------------------------------- |
| `01-listagem-busca.cy.ts`           | Busca em cada aba (permanente/consumo). |
| `02-cadastro-edicao-exclusao.cy.ts` | CRUD completo.                          |

## Variáveis de Ambiente Usadas

| Variável       | Uso na suite                     |
| :------------- | :------------------------------- |
| `FRONTEND_URL` | Base para navegação.             |
| `API_URL`      | Base para fábricas via `cy.api`. |

## Observações de Implementação para os Casos E2E

| Ponto                                | Diretriz                                                                                                      |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `data-test` adicionado nesta entrega | Os modais de editar/excluir categoria não tinham `data-test` por campo — instrumentados junto com esta suíte. |
| Busca após renomear                  | Sempre atualizar `search-input` com o novo nome antes de asserir visibilidade pós-edição.                     |
