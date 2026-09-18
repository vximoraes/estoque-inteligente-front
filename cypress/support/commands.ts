declare global {
  namespace Cypress {
    interface Chainable {
      getByData(
        seletor: string,
        options?: Partial<Cypress.Timeoutable & Cypress.Loggable>,
      ): Chainable<JQuery<HTMLElement>>;
      loginViaAPI(email: string, senha: string): Chainable<void>;
      login(email?: string, senha?: string): Chainable<void>;
      api(
        metodo: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
        caminho: string,
        body?: Cypress.RequestBody,
      ): Chainable<Cypress.Response<any>>;
      irPara(rota: string, marcadorPagina: string): Chainable<void>;
      esperarToast(mensagem: string | RegExp): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add(
  'getByData',
  (
    seletor: string,
    options?: Partial<Cypress.Timeoutable & Cypress.Loggable>,
  ) => {
    return cy.get(`[data-test="${seletor}"]`, options);
  },
);

// Better Auth é cookie-based: o Set-Cookie da resposta já autentica as
// requisições seguintes no mesmo domínio (porta é ignorada pelo cookie).
Cypress.Commands.add('loginViaAPI', (email: string, senha: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/auth/sign-in/email`,
    headers: { Origin: Cypress.env('FRONTEND_URL') },
    body: { email, password: senha },
  }).then((response) => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add(
  'login',
  (
    email = Cypress.env('TEST_USER_EMAIL'),
    senha = Cypress.env('TEST_USER_PASSWORD'),
  ) => {
    // cy.session cacheia a sessão entre specs (e entre runs, via
    // cacheAcrossSpecs) — sem isso cada spec faria login de novo, e mesmo
    // com a API de teste (rate limit desligado) isso custa tempo à toa.
    cy.session(['sessao', email], () => cy.loginViaAPI(email, senha), {
      cacheAcrossSpecs: true,
      validate() {
        // Cookie presente não prova sessão válida: um reseed do banco
        // efêmero invalida a sessão sem apagar o cookie cacheado pelo
        // Cypress. Confirma batendo na própria API.
        cy.request({
          url: `${Cypress.env('API_URL')}/api/auth/get-session`,
          failOnStatusCode: false,
        })
          .its('body.user.id')
          .should('be.a', 'string');
      },
    });
  },
);

Cypress.Commands.add('api', (metodo, caminho, body) => {
  return cy.request({
    method: metodo,
    url: `${Cypress.env('API_URL')}${caminho}`,
    body,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('irPara', (rota: string, marcadorPagina: string) => {
  cy.visit(rota);
  cy.getByData(marcadorPagina).should('be.visible');
});

// react-toastify (não sonner) — ver package.json.
Cypress.Commands.add('esperarToast', (mensagem: string | RegExp) => {
  return cy.get('.Toastify__toast').contains(mensagem).should('be.visible');
});

export {};
