# Suite de Testes E2E — Fornecedores (`/fornecedores`)

Testes E2E (UI) que validam listagem, busca, cadastro, edição e exclusão de fornecedores.

Arquivos: `cypress/e2e/fornecedores/{01-listagem-busca,02-cadastro-edicao-exclusao}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                   | Comportamento Atual do Sistema                             | Impacto na Suite E2E                                      |
| :---------------------- | :--------------------------------------------------------- | :-------------------------------------------------------- |
| Único campo obrigatório | Só `nome` é exigido no cadastro — os demais são opcionais. | Teste de cadastro válido preenche só `nome-input`.        |
| Sem exclusão física     | Exclusão é sempre inativação (soft-delete).                | Assert pós-exclusão verifica ausência na busca, não erro. |

## Massa de Dados Recomendada

| Entidade                   | Objetivo nos testes              |
| :------------------------- | :------------------------------- |
| Fornecedor criado em teste | Nome prefixado `zz-fornecedor-`. |

## Pré-condições Técnicas da Suite

| Etapa        | Objetivo                                | Critério                                    |
| :----------- | :-------------------------------------- | :------------------------------------------ |
| `cy.login()` | Autenticar como admin, sessão cacheada. | Sessão válida confirmada via `get-session`. |

## Listagem e busca

| Funcionalidade             | Comportamento Esperado             | Verificações               | Critérios de Aceite           |
| :------------------------- | :--------------------------------- | :------------------------- | :---------------------------- |
| **Cenários felizes**       |                                    |                            |                               |
| Buscar fornecedor por nome | Deve retornar o fornecedor criado. | Digitar em `search-input`. | Fornecedor aparece na tabela. |

## Cadastro, edição e exclusão

| Funcionalidade       | Comportamento Esperado                 | Verificações                                           | Critérios de Aceite                            |
| :------------------- | :------------------------------------- | :----------------------------------------------------- | :--------------------------------------------- |
| **Cenários felizes** |                                        |                                                        |                                                |
| Cadastro válido      | Deve criar o fornecedor.               | Preencher `nome-input`, confirmar.                     | Fornecedor aparece na busca.                   |
| Editar nome          | Deve atualizar o nome exibido.         | Ação de editar na linha, alterar `nome-input`, salvar. | Novo nome aparece na busca pelo novo nome.     |
| Excluir fornecedor   | Deve remover o fornecedor da listagem. | Ação de excluir na linha, confirmar.                   | Fornecedor some da busca.                      |
| **Cenários tristes** |                                        |                                                        |                                                |
| Cadastro sem nome    | Deve manter o modal aberto.            | Confirmar cadastro com campo vazio.                    | `modal-cadastrar-fornecedor` continua visível. |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                        |
| :---------------------- | :----------------------------------------------------- |
| Seleção por `data-test` | Toda interação usa `cy.getByData`.                     |
| Massa de dados          | Todo fornecedor de teste usa prefixo `zz-fornecedor-`. |

## Estratégia de Organização dos Testes E2E

| Bloco                               | Objetivo        |
| :---------------------------------- | :-------------- |
| `01-listagem-busca.cy.ts`           | Busca por nome. |
| `02-cadastro-edicao-exclusao.cy.ts` | CRUD completo.  |

## Variáveis de Ambiente Usadas

| Variável       | Uso na suite                     |
| :------------- | :------------------------------- |
| `FRONTEND_URL` | Base para navegação.             |
| `API_URL`      | Base para fábricas via `cy.api`. |

## Observações de Implementação para os Casos E2E

| Ponto                        | Diretriz                                                                                                                   |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| Domínio já bem instrumentado | Todos os modais de fornecedor já tinham `data-test` completo — nenhum ajuste de componente foi necessário para esta suíte. |
