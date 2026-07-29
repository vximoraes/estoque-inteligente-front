declare global {
  namespace Cypress {
    interface Chainable {
      getByData(seletor: string): Chainable<JQuery<HTMLElement>>;
      login(email: string, senha: string): Chainable<void>;
      loginViaAPI(email: string, senha: string): Chainable<void>;
      waitForItens(): Chainable<void>;
      clearAllFilters(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('getByData', (seletor: string) => {
  return cy.get(`[data-test="${seletor}"]`);
});

Cypress.Commands.add('login', (email: string, senha: string) => {
  const frontendUrl = Cypress.env('FRONTEND_URL');

  cy.visit(`${frontendUrl}/login`);
  cy.wait(1000);

  cy.getByData('email-input').should('be.visible').clear().type(email);
  cy.getByData('senha-input').should('be.visible').clear().type(senha);

  cy.getByData('botao-entrar')
    .should('be.visible')
    .should('not.be.disabled')
    .click();

  cy.wait(3000);

  cy.url({ timeout: 30000 }).should('include', '/itens');
});

Cypress.Commands.add('loginViaAPI', (email: string, senha: string) => {
  const apiUrl = Cypress.env('API_URL');

  // Better Auth é cookie-based: o Set-Cookie da resposta já autentica
  // requisições seguintes (cy.request e o app), sem precisar guardar nada
  // manualmente. Não usar Authorization: Bearer com valor de localStorage
  // depois disso — não existe token nenhum lá.
  cy.request({
    method: 'POST',
    url: `${apiUrl}/api/auth/sign-in/email`,
    body: {
      email,
      password: senha,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add('waitForItens', () => {
  cy.wait('@getComponentes', { timeout: 10000 });
});

Cypress.Commands.add('clearAllFilters', () => {
  cy.get('body').then(($body) => {
    if (
      $body.text().includes('Limpar filtros') ||
      $body.text().includes('Limpar')
    ) {
      cy.contains(/Limpar filtros|Limpar/i).click();
    }

    const filterTags = $body.find('[data-testid*="filter-tag"]');
    if (filterTags.length > 0) {
      filterTags.each((index, element) => {
        cy.wrap(element).find('button').click();
      });
    }
  });
});

export {};
