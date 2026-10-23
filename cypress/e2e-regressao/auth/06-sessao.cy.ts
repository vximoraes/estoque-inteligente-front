describe('Sessão e navegação', () => {
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  it('sem sessão, página protegida manda para o login guardando a origem', () => {
    cy.clearCookies();
    cy.visit('/bens/almoxarifado');
    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('include', 'from=%2Fbens%2Falmoxarifado');
  });

  it('depois do login volta para a página de origem', () => {
    cy.clearCookies();
    cy.visit('/login?from=%2Frelatorios');
    cy.getByData('email-input').type(email);
    cy.getByData('senha-input').type(senha);
    cy.getByData('botao-entrar').click();
    cy.location('pathname', { timeout: 30000 }).should('eq', '/relatorios');
  });

  it('não redireciona para fora do sistema pelo parâmetro de origem', () => {
    cy.clearCookies();
    cy.visit('/login?from=%2F%2Fexemplo.com');
    cy.getByData('email-input').type(email);
    cy.getByData('senha-input').type(senha);
    cy.getByData('botao-entrar').click();
    cy.location('pathname', { timeout: 30000 }).should(
      'eq',
      '/bens/patrimonio',
    );
  });

  it('sair encerra a sessão e protege as páginas de novo', () => {
    cy.clearCookies();
    cy.loginViaAPI(email, senha);
    cy.irPara('/bens/patrimonio', 'patrimonio-page');
    cy.getByData('sidebar-btn-sair').click();
    cy.location('pathname', { timeout: 15000 }).should('eq', '/login');
    cy.visit('/bens/patrimonio');
    cy.location('pathname').should('eq', '/login');
  });

  it('sessão expirada no meio do uso (401) leva ao login', () => {
    cy.login();
    cy.intercept('GET', `${Cypress.env('API_URL')}/itens*`, {
      statusCode: 401,
      body: { error: true, code: 401, message: 'Sessão expirada', errors: [] },
    });
    cy.visit('/bens/almoxarifado');
    cy.location('pathname', { timeout: 15000 }).should('eq', '/login');
  });
});
