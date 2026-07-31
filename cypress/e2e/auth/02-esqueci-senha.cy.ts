describe('Esqueci minha senha', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');

  beforeEach(() => {
    cy.clearCookies();
    cy.visit(`${frontendUrl}/esqueci-senha`);
  });

  it('mostra tela de confirmação após enviar e-mail válido', () => {
    cy.getByData('email-input').type(email);
    cy.getByData('botao-enviar-link').click();

    cy.getByData('email-enviado-confirmacao', { timeout: 10000 }).should(
      'be.visible',
    );
    cy.contains(email).should('be.visible');
  });

  it('valida formato de e-mail no client antes de chamar a API', () => {
    cy.intercept('POST', '**/api/auth/request-password-reset').as(
      'requestReset',
    );

    cy.getByData('email-input').type('nao-e-um-email');
    cy.getByData('botao-enviar-link').click();

    cy.contains('Formato de e-mail inválido').should('be.visible');
    cy.get('@requestReset.all').should('have.length', 0);
  });

  it('mostra a mesma confirmação pra e-mail que não existe (não revela se a conta existe)', () => {
    cy.getByData('email-input').type('nao-cadastrado-e2e@teste.local');
    cy.getByData('botao-enviar-link').click();

    cy.getByData('email-enviado-confirmacao', { timeout: 10000 }).should(
      'be.visible',
    );
  });

  it('link "Acessar sistema" volta pro login', () => {
    cy.contains('Acessar sistema').click();
    cy.url().should('include', '/login');
    cy.getByData('email-input').should('be.visible');
  });
});
