# Suite de Testes E2E — Relatórios (`/relatorios`)

Testes E2E (UI) que validam a navegação entre as cinco abas de relatório (patrimônio, almoxarifado, movimentações, empréstimos, tendência), filtros e o fluxo de exportação.

Arquivos: `cypress/e2e/relatorios/{01-navegacao-abas,02-filtros-exportacao}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                               | Comportamento Atual do Sistema                                                          | Impacto na Suite E2E                                                        |
| :---------------------------------- | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| Aba sincronizada com a URL (`nuqs`) | O parâmetro `?tab=` define a aba ativa; padrão é `patrimonio`.                          | Deep-link direto (`/relatorios?tab=emprestimos`) é testado explicitamente.  |
| Exportação exige seleção            | No relatório de patrimônio, o botão "Exportar" fica desabilitado sem unidades marcadas. | A spec seleciona todas as linhas (`checkbox-select-all`) antes de exportar. |
| Sem export na aba de tendência      | A aba "Tendência" não tem botão de exportação.                                          | Suíte não testa exportação nessa aba.                                       |

## Massa de Dados Recomendada

| Entidade                    | Objetivo nos testes                                        |
| :-------------------------- | :--------------------------------------------------------- |
| Localização criada em teste | Usada no filtro de localização do relatório de patrimônio. |

## Pré-condições Técnicas da Suite

| Etapa        | Objetivo                                | Critério                                    |
| :----------- | :-------------------------------------- | :------------------------------------------ |
| `cy.login()` | Autenticar como admin, sessão cacheada. | Sessão válida confirmada via `get-session`. |

## Navegação entre abas

| Funcionalidade             | Comportamento Esperado                               | Verificações                           | Critérios de Aceite                            |
| :------------------------- | :--------------------------------------------------- | :------------------------------------- | :--------------------------------------------- |
| **Cenários felizes**       |                                                      |                                        |                                                |
| Abrir na aba de patrimônio | Deve ser a aba padrão ao visitar `/relatorios`.      | Visitar `/relatorios`.                 | `relatorio-patrimonio-page` visível.           |
| Navegar para cada aba      | Deve trocar o conteúdo exibido.                      | Clicar em cada `relatorios-tab-<aba>`. | `relatorio-<aba>-page` correspondente visível. |
| Deep-link por URL          | Deve abrir direto na aba indicada pela query string. | Visitar `/relatorios?tab=emprestimos`. | `relatorio-emprestimos-page` visível.          |

## Filtros e exportação

| Funcionalidade                           | Comportamento Esperado               | Verificações                                                                  | Critérios de Aceite                        |
| :--------------------------------------- | :----------------------------------- | :---------------------------------------------------------------------------- | :----------------------------------------- |
| **Cenários felizes**                     |                                      |                                                                               |                                            |
| Filtrar patrimônio por localização       | Deve aplicar o filtro sem erros.     | Selecionar localização em `filtro-localizacao-trigger`.                       | Opção selecionável e sem erro na tela.     |
| Abrir e cancelar exportação              | Deve fechar o modal sem exportar.    | Selecionar todas as linhas, abrir "Exportar", escolher formato CSV, cancelar. | `modal-exportar-overlay` deixa de existir. |
| Abrir seletor de período (movimentações) | Deve exibir o calendário de período. | Trocar para aba "Movimentações", clicar `filtro-periodo-trigger`.             | `filtro-periodo-calendar` visível.         |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                                                                   |
| :---------------------- | :------------------------------------------------------------------------------------------------ |
| Seleção por `data-test` | Toda interação usa `cy.getByData`.                                                                |
| Hidratação de `nuqs`    | Nunca asserir logo após `cy.visit` — sempre esperar o marcador da própria aba antes de interagir. |

## Estratégia de Organização dos Testes E2E

| Bloco                         | Objetivo                                               |
| :---------------------------- | :----------------------------------------------------- |
| `01-navegacao-abas.cy.ts`     | Aba padrão, troca entre as 5 abas, deep-link por URL.  |
| `02-filtros-exportacao.cy.ts` | Filtro de localização, exportação, seletor de período. |

## Variáveis de Ambiente Usadas

| Variável       | Uso na suite                     |
| :------------- | :------------------------------- |
| `FRONTEND_URL` | Base para navegação.             |
| `API_URL`      | Base para fábricas via `cy.api`. |

## Observações de Implementação para os Casos E2E

| Ponto                                     | Diretriz                                                                                                                       |
| :---------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| Exportação real não é acionada            | A suíte abre o modal e cancela — não confirma a exportação de fato, para não depender de geração de PDF/CSV no ambiente de CI. |
| Botão de exportar pode estar desabilitado | Sempre checar se há um requisito de seleção prévia (ex.: `checkbox-select-all`) antes de tentar clicar em "Exportar".          |
