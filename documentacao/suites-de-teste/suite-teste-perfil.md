# Suite de Testes E2E — Perfil (`/perfil`)

Testes E2E (UI) que validam a exibição de informações da conta, edição de nome e a seção de notificações do usuário autenticado.

Arquivos: `cypress/e2e/perfil/{01-informacoes-edicao,02-notificacoes}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                          | Comportamento Atual do Sistema                                                                     | Impacto na Suite E2E                                                     |
| :----------------------------- | :------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| Conta compartilhada pela suíte | O admin é reutilizado por toda a suíte E2E via `cy.session`.                                       | O teste que salva um novo nome sempre restaura o nome original ao final. |
| Troca de senha não é testada   | Alterar a senha do admin invalidaria a sessão cacheada de todas as outras specs.                   | Nenhum teste desta suíte submete o formulário de troca de senha de fato. |
| Notificações são por autor     | `/notificacoes` sempre pertence a quem está autenticado (ver `suite-teste-notificacao.md` da API). | Toda notificação de teste é criada via API já no escopo do admin logado. |

## Massa de Dados Recomendada

| Entidade                    | Objetivo nos testes                                 |
| :-------------------------- | :-------------------------------------------------- |
| Notificação criada em teste | Mensagem prefixada `zz-notificacao-`, via `cy.api`. |

## Pré-condições Técnicas da Suite

| Etapa        | Objetivo                                | Critério                                    |
| :----------- | :-------------------------------------- | :------------------------------------------ |
| `cy.login()` | Autenticar como admin, sessão cacheada. | Sessão válida confirmada via `get-session`. |

## Informações e edição de nome

| Funcionalidade                          | Comportamento Esperado                          | Verificações                                                | Critérios de Aceite                               |
| :-------------------------------------- | :---------------------------------------------- | :---------------------------------------------------------- | :------------------------------------------------ |
| **Cenários felizes**                    |                                                 |                                                             |                                                   |
| Exibir informações da conta             | Nome e e-mail devem estar visíveis.             | Visitar `/perfil`.                                          | `perfil-nome`/`perfil-email` visíveis.            |
| Editar e cancelar                       | Deve fechar o formulário sem alterar o nome.    | Abrir edição, cancelar.                                     | `form-editar-nome` deixa de existir.              |
| Salvar novo nome e restaurar o original | Deve persistir a alteração e permitir reverter. | Editar, salvar; editar de novo com o nome original, salvar. | Nome exibido reflete cada alteração, nessa ordem. |

## Notificações

| Funcionalidade                 | Comportamento Esperado               | Verificações                                    | Critérios de Aceite                              |
| :----------------------------- | :----------------------------------- | :---------------------------------------------- | :----------------------------------------------- |
| **Cenários felizes**           |                                      |                                                 |                                                  |
| Listar notificações do usuário | Deve exibir a notificação criada.    | Criar via API, visitar `/perfil`.               | `notificacao-item-<id>` contém a mensagem.       |
| Marcar todas como lidas        | Deve zerar o contador de não lidas.  | Clicar `marcar-todas-lidas-button`.             | `notificacoes-nao-lidas-count` deixa de existir. |
| Excluir notificação            | Deve remover a notificação da lista. | Botão de excluir dentro do item da notificação. | Item da notificação deixa de existir.            |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                                       |
| :---------------------- | :-------------------------------------------------------------------- |
| Seleção por `data-test` | Toda interação usa `cy.getByData`.                                    |
| Estado compartilhado    | Testes que alteram dado do admin (nome) sempre revertem antes do fim. |

## Estratégia de Organização dos Testes E2E

| Bloco                         | Objetivo                                              |
| :---------------------------- | :---------------------------------------------------- |
| `01-informacoes-edicao.cy.ts` | Exibição de dados, edição de nome com reversão.       |
| `02-notificacoes.cy.ts`       | Listagem, marcação em massa, exclusão de notificação. |

## Variáveis de Ambiente Usadas

| Variável       | Uso na suite                     |
| :------------- | :------------------------------- |
| `FRONTEND_URL` | Base para navegação.             |
| `API_URL`      | Base para fábricas via `cy.api`. |

## Observações de Implementação para os Casos E2E

| Ponto                          | Diretriz                                                                                          |
| :----------------------------- | :------------------------------------------------------------------------------------------------ |
| Não testar troca de senha real | Mudar a senha do admin quebraria `cy.session` de todo o resto da suíte E2E — fora de escopo aqui. |
| Reverter alteração de nome     | Qualquer teste que salve um novo nome precisa restaurar o valor original antes de terminar.       |
