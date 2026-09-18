describe('Login', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.clearCookies();
  });

  it('faz login com credenciais válidas e redireciona pra /bens/patrimonio', () => {
    cy.visit(`${frontendUrl}/login`);
    cy.getByData('email-input').type(email);
    cy.getByData('senha-input').type(senha);
    cy.getByData('botao-entrar').click();

    cy.url({ timeout: 30000 }).should('include', '/bens/patrimonio');
  });

  it('exibe erro de e-mail/senha incorretos com senha errada', () => {
    cy.visit(`${frontendUrl}/login`);
    cy.getByData('email-input').type(email);
    cy.getByData('senha-input').type('SenhaErrada@999');
    cy.getByData('botao-entrar').click();

    cy.contains('E-mail ou senha incorretos.', { timeout: 10000 }).should(
      'be.visible',
    );
    cy.url().should('include', '/login');
  });

  it('valida formato de e-mail no client antes de chamar a API', () => {
    cy.intercept('POST', '**/api/auth/sign-in/email').as('signIn');

    cy.visit(`${frontendUrl}/login`);
    cy.getByData('email-input').type('nao-e-um-email');
    cy.getByData('senha-input').type(senha);
    cy.getByData('botao-entrar').click();

    cy.contains('Formato de e-mail inválido').should('be.visible');
    cy.get('@signIn.all').should('have.length', 0);
  });

  it('mostra mensagem de espera quando a API responde 429', () => {
    // A API de teste roda com NODE_ENV=test, que desliga o rate limit do
    // Better Auth — não dá pra provocar um 429 real aqui. Este teste cobre
    // só a responsabilidade do front: renderizar a mensagem certa quando a
    // API responde 429 com o header X-Retry-After. O algoritmo de rate
    // limit em si (3 tentativas/10s) é responsabilidade do Better Auth,
    // não do front.
    cy.intercept('POST', '**/api/auth/sign-in/email', {
      statusCode: 429,
      body: { message: 'Too many requests' },
      headers: { 'x-retry-after': '10' },
    }).as('signInBloqueado');

    cy.visit(`${frontendUrl}/login`);
    cy.getByData('email-input').type(email);
    cy.getByData('senha-input').type(senha);
    cy.getByData('botao-entrar').click();

    cy.wait('@signInBloqueado');
    cy.contains(/Muitas tentativas\./, { timeout: 10000 }).should('be.visible');
  });

  it('exibe checkbox de lembrar-me e botão de login com Google', () => {
    cy.visit(`${frontendUrl}/login`);
    cy.getByData('lembrar-me-checkbox')
      .should('exist')
      .and('have.attr', 'data-state', 'unchecked');
    cy.getByData('lembrar-me-checkbox')
      .click()
      .should('have.attr', 'data-state', 'checked');
    cy.getByData('botao-google').should('be.visible').and('not.be.disabled');
  });
});
