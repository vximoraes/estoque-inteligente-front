# Suite de Testes E2E — Localizações (`/localizacoes`)

Testes E2E (UI) que validam listagem, busca, cadastro, edição e exclusão de localizações.

Arquivos: `cypress/e2e/localizacoes/{01-listagem-busca,02-cadastro-edicao-exclusao}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                            | Comportamento Atual do Sistema                                        | Impacto na Suite E2E                                |
| :------------------------------- | :-------------------------------------------------------------------- | :-------------------------------------------------- |
| Sem tipo/tabs                    | Ao contrário de categorias, localizações não têm abas por tipo.       | Uma única tela, sem necessidade de trocar de aba.   |
| Filtro de busca reseta ao editar | Renomear não atualiza sozinho o filtro já aplicado com o nome antigo. | Após editar, a spec busca novamente pelo nome novo. |

## Massa de Dados Recomendada

| Entidade                    | Objetivo nos testes               |
| :-------------------------- | :-------------------------------- |
| Localização criada em teste | Nome prefixado `zz-localizacao-`. |

## Pré-condições Técnicas da Suite

| Etapa        | Objetivo                                | Critério                                    |
| :----------- | :-------------------------------------- | :------------------------------------------ |
| `cy.login()` | Autenticar como admin, sessão cacheada. | Sessão válida confirmada via `get-session`. |

## Listagem e busca

| Funcionalidade              | Comportamento Esperado              | Verificações               | Critérios de Aceite            |
| :-------------------------- | :---------------------------------- | :------------------------- | :----------------------------- |
| **Cenários felizes**        |                                     |                            |                                |
| Buscar localização por nome | Deve retornar a localização criada. | Digitar em `search-input`. | Localização aparece na tabela. |

## Cadastro, edição e exclusão

| Funcionalidade       | Comportamento Esperado                  | Verificações                                           | Critérios de Aceite                             |
| :------------------- | :-------------------------------------- | :----------------------------------------------------- | :---------------------------------------------- |
| **Cenários felizes** |                                         |                                                        |                                                 |
| Cadastro válido      | Deve criar a localização.               | Preencher `nome-input`, confirmar.                     | Localização aparece na busca.                   |
| Editar nome          | Deve atualizar o nome exibido.          | Ação de editar na linha, alterar `nome-input`, salvar. | Novo nome aparece na busca pelo novo nome.      |
| Excluir localização  | Deve remover a localização da listagem. | Ação de excluir na linha, confirmar.                   | Localização some da busca.                      |
| **Cenários tristes** |                                         |                                                        |                                                 |
| Cadastro sem nome    | Deve manter o modal aberto.             | Confirmar cadastro com campo vazio.                    | `modal-cadastrar-localizacao` continua visível. |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                          |
| :---------------------- | :------------------------------------------------------- |
| Seleção por `data-test` | Toda interação usa `cy.getByData`.                       |
| Massa de dados          | Toda localização de teste usa prefixo `zz-localizacao-`. |

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

| Ponto                                | Diretriz                                                                                                        |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| `data-test` adicionado nesta entrega | Os modais de editar/excluir localização não tinham `data-test` por campo — instrumentados junto com esta suíte. |
| Busca após renomear                  | Sempre atualizar `search-input` com o novo nome antes de asserir visibilidade pós-edição.                       |
