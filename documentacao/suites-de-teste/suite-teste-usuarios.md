# Suite de Testes E2E — Usuários (`/usuarios`)

Testes E2E (UI) que validam listagem, busca, convite, detalhes e exclusão de usuários — tela restrita a quem tem permissão administrativa.

Arquivos: `cypress/e2e/usuarios/{01-listagem-busca,02-cadastro-detalhes-exclusao}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                                 | Comportamento Atual do Sistema                                                                                            | Impacto na Suite E2E                                                                                                  |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| Tela restrita a administradores       | `usuarios-client.tsx` chama `notFound()` quando `canManageUsers()` é falso.                                               | Toda spec usa `cy.login()` com o admin (default).                                                                     |
| Nome do usuário tem validação estrita | O campo `nome` do formulário de convite exige capitalização por palavra, só letras (regex do zod) — nem hífen nem número. | O nome digitado na UI não pode usar o padrão `zz-usuario-<numero>` das outras fábricas; unicidade real vem do e-mail. |
| Sem autocadastro                      | Só existe convite pelo admin — conta nasce `ativo: false`, pendente de ativação (ver `suite-teste-login.md`).             | Não há spec de "usuário se cadastra sozinho".                                                                         |

## Massa de Dados Recomendada

| Entidade                   | Objetivo nos testes                                                              |
| :------------------------- | :------------------------------------------------------------------------------- |
| Usuário convidado em teste | Convidado via API (`convidarUsuario`) — `nome`/`email` prefixados `zz-usuario-`. |
| Usuário convidado via UI   | Usa nome fixo válido ("Zz Usuario Teste") — só o e-mail precisa ser único.       |

## Pré-condições Técnicas da Suite

| Etapa        | Objetivo                                | Critério                                    |
| :----------- | :-------------------------------------- | :------------------------------------------ |
| `cy.login()` | Autenticar como admin, sessão cacheada. | Sessão válida confirmada via `get-session`. |

## Listagem e busca

| Funcionalidade          | Comportamento Esperado             | Verificações               | Critérios de Aceite        |
| :---------------------- | :--------------------------------- | :------------------------- | :------------------------- |
| **Cenários felizes**    |                                    |                            |                            |
| Buscar usuário por nome | Deve retornar o usuário convidado. | Digitar em `search-input`. | Usuário aparece na tabela. |

## Convite, detalhes e exclusão

| Funcionalidade            | Comportamento Esperado                     | Verificações                                                     | Critérios de Aceite                             |
| :------------------------ | :----------------------------------------- | :--------------------------------------------------------------- | :---------------------------------------------- |
| **Cenários felizes**      |                                            |                                                                  |                                                 |
| Convidar novo usuário     | Deve criar o convite e listá-lo.           | Preencher `nome-input` (nome válido) e `email-input`, confirmar. | Usuário aparece na busca pelo nome.             |
| Visualizar detalhes       | Deve exibir o e-mail do usuário convidado. | Ação "Visualizar" na linha.                                      | `modal-detalhes-email` contém o e-mail correto. |
| Excluir usuário convidado | Deve remover o usuário da listagem.        | Ação "Excluir" na linha, confirmar.                              | Usuário some da busca.                          |
| **Cenários tristes**      |                                            |                                                                  |                                                 |
| Convite sem e-mail        | Deve manter o modal aberto.                | Confirmar convite só com nome preenchido.                        | `modal-cadastrar-usuario` continua visível.     |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                                                                |
| :---------------------- | :--------------------------------------------------------------------------------------------- |
| Seleção por `data-test` | Toda interação usa `cy.getByData`.                                                             |
| Massa de dados          | Convite via API usa prefixo `zz-usuario-`; convite via UI usa nome válido fixo + e-mail único. |

## Estratégia de Organização dos Testes E2E

| Bloco                                 | Objetivo                                       |
| :------------------------------------ | :--------------------------------------------- |
| `01-listagem-busca.cy.ts`             | Busca por nome.                                |
| `02-cadastro-detalhes-exclusao.cy.ts` | Convite (válido/inválido), detalhes, exclusão. |

## Variáveis de Ambiente Usadas

| Variável       | Uso na suite                     |
| :------------- | :------------------------------- |
| `FRONTEND_URL` | Base para navegação.             |
| `API_URL`      | Base para fábricas via `cy.api`. |

## Observações de Implementação para os Casos E2E

| Ponto                                               | Diretriz                                                                                                                                                                                                                                                                       |
| :-------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bug corrigido durante o desenvolvimento desta suíte | `usePermissions()` não considerava o carregamento da sessão — `canManageUsers()` avaliava como `false` antes da sessão resolver, disparando `notFound()` mesmo para o admin. Corrigido: `loading` do hook agora combina o carregamento da sessão com o da query de permissões. |
| Regex de nome                                       | `src/schemas/usuario.schema.ts` exige `[A-ZÀ-Ö][a-zà-öø-ÿ]{1,}` por palavra — usar nome fixo capitalizado na UI, nunca o padrão `zz-<slug>-<numero>`.                                                                                                                          |
