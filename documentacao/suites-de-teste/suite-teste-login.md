# Suite de Testes E2E — Login (`/login`, `/esqueci-senha`, `/redefinir-senha`, `/ativar-conta`)

Testes E2E (UI) que validam o fluxo completo de autenticação: login, recuperação de senha, redefinição e ativação de conta.

Arquivos: `cypress/e2e/auth/{01-login,02-esqueci-senha,03-redefinir-senha,04-ativar-conta}.cy.ts`

## Visão de Fluxo e Regras de Negócio

| Regra                                | Comportamento Atual do Sistema                                                                                        | Impacto na Suite E2E                                                               |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| Sem autocadastro público             | Só existe login — conta nasce por convite do admin (ver `suite-teste-usuarios.md`).                                   | Não há spec de cadastro nesta suíte.                                               |
| Rate limit real só fora de teste     | Better Auth bloqueia após 3 tentativas/10s, mas a API de teste (`NODE_ENV=test`) desliga esse limite.                 | O cenário de 429 usa `cy.intercept` para simular a resposta, não o algoritmo real. |
| Validação de e-mail é só client-side | Formato de e-mail inválido nunca chega a chamar a API.                                                                | Assert de que `cy.intercept` não registra nenhuma chamada.                         |
| Sessão via cookie                    | Better Auth grava `better-auth.session_token`; todo o resto da suíte de E2E reaproveita essa sessão via `cy.session`. | Esta é a única spec que loga pela UI em todas as outras (ver Observações).         |

## Massa de Dados Recomendada

| Entidade                     | Objetivo nos testes                                    |
| :--------------------------- | :----------------------------------------------------- |
| Admin (seed da API de teste) | Credenciais de `TEST_USER_EMAIL`/`TEST_USER_PASSWORD`. |

## Pré-condições Técnicas da Suite

| Etapa                                                     | Objetivo                                                  | Critério                  |
| :-------------------------------------------------------- | :-------------------------------------------------------- | :------------------------ |
| API de teste no ar (`npm run test:server` na API)         | Fornece `/api/auth/*` real para os testes de login/senha. | Porta `3011` respondendo. |
| Front em modo produção (`npm run build && npm run start`) | Evita falso-negativo por chunk sob demanda do modo dev.   | Porta `3000` respondendo. |

## Login (`/login`)

| Funcionalidade                       | Comportamento Esperado                                  | Verificações                                                           | Critérios de Aceite                                              |
| :----------------------------------- | :------------------------------------------------------ | :--------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **Cenários felizes**                 |                                                         |                                                                        |                                                                  |
| Login com credenciais válidas        | Deve autenticar e redirecionar para `/bens/patrimonio`. | Preencher `email-input`/`senha-input`, clicar `botao-entrar`.          | URL passa a conter `/bens/patrimonio`.                           |
| Checkbox "lembrar-me" e botão Google | Devem estar visíveis e responder a interação.           | Clicar em `lembrar-me-checkbox`; inspecionar `botao-google`.           | Checkbox alterna `data-state`; botão Google habilitado.          |
| **Cenários tristes**                 |                                                         |                                                                        |                                                                  |
| Senha incorreta                      | Deve exibir mensagem de erro e permanecer em `/login`.  | Login com senha errada.                                                | Mensagem "E-mail ou senha incorretos." visível.                  |
| Formato de e-mail inválido           | Deve validar no client, sem chamar a API.               | Digitar e-mail malformado; interceptar `POST /api/auth/sign-in/email`. | Mensagem "Formato de e-mail inválido"; 0 chamadas interceptadas. |
| Resposta 429 da API                  | Deve exibir mensagem de espera.                         | `cy.intercept` simulando `429` com header `X-Retry-After`.             | Mensagem "Muitas tentativas." visível.                           |

## Esqueci a senha (`/esqueci-senha`)

| Funcionalidade         | Comportamento Esperado                                | Verificações               | Critérios de Aceite                       |
| :--------------------- | :---------------------------------------------------- | :------------------------- | :---------------------------------------- |
| **Cenários felizes**   |                                                       |                            |                                           |
| Solicitar recuperação  | Deve confirmar o envio sem revelar se a conta existe. | Preencher e-mail, enviar.  | Mensagem de confirmação genérica visível. |
| Link "voltar ao login" | Deve retornar para `/login`.                          | Clicar no link de retorno. | URL volta a `/login`.                     |

## Redefinir senha (`/redefinir-senha`)

| Funcionalidade                    | Comportamento Esperado                                   | Verificações                              | Critérios de Aceite                         |
| :-------------------------------- | :------------------------------------------------------- | :---------------------------------------- | :------------------------------------------ |
| **Cenários tristes**              |                                                          |                                           |                                             |
| Sem token na URL                  | Deve exibir estado de token inválido.                    | Visitar `/redefinir-senha` sem `?token=`. | Marcador `token-invalido` visível.          |
| Senhas divergentes                | Deve rejeitar confirmação que não bate com a nova senha. | Preencher senha e confirmação diferentes. | Mensagem de erro de divergência visível.    |
| Requisitos de senha em tempo real | Deve destacar cada requisito conforme atendido.          | Digitar senha incrementalmente.           | Classes de requisito atendido mudam de cor. |

## Ativar conta (`/ativar-conta`)

| Funcionalidade       | Comportamento Esperado                | Verificações                           | Critérios de Aceite                |
| :------------------- | :------------------------------------ | :------------------------------------- | :--------------------------------- |
| **Cenários tristes** |                                       |                                        |                                    |
| Sem token na URL     | Deve exibir estado de token inválido. | Visitar `/ativar-conta` sem `?token=`. | Marcador `token-invalido` visível. |

## Cenários Transversais Obrigatórios (E2E)

| Tema                    | Verificação E2E                                                 |
| :---------------------- | :-------------------------------------------------------------- |
| Seleção por `data-test` | Toda interação usa `cy.getByData`, nunca texto/classe frágil.   |
| Sessão real             | O login válido bate na API de teste de verdade — não é mockado. |

## Estratégia de Organização dos Testes E2E

| Bloco                             | Objetivo                                                            |
| :-------------------------------- | :------------------------------------------------------------------ |
| `cypress/e2e/auth/01-login.cy.ts` | Login válido/inválido, validação client-side, 429, checkbox/Google. |
| `02-esqueci-senha.cy.ts`          | Fluxo de recuperação de senha.                                      |
| `03-redefinir-senha.cy.ts`        | Fluxo de redefinição, token ausente, requisitos de senha.           |
| `04-ativar-conta.cy.ts`           | Fluxo de ativação de conta convidada, token ausente.                |

## Variáveis de Ambiente Usadas

| Variável                               | Uso na suite                                         |
| :------------------------------------- | :--------------------------------------------------- |
| `FRONTEND_URL`                         | Base para `cy.visit`.                                |
| `API_URL`                              | Base para `cy.request`/`cy.intercept` diretos à API. |
| `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` | Credenciais do admin semeado.                        |

## Observações de Implementação para os Casos E2E

| Ponto                         | Diretriz                                                                                                             |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| Única spec que loga pela UI   | Todas as outras suítes usam `cy.login()` (sessão cacheada via API) — só `01-login.cy.ts` testa o formulário de fato. |
| 429 é simulado, não provocado | A API de teste desliga o rate limit real; testar o algoritmo do Better Auth está fora do escopo do front.            |
