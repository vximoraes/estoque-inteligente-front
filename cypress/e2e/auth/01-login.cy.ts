describe('Login', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.clearCookies();
  });

  it('faz login com credenciais válidas e redireciona pra /itens', () => {
    cy.visit(`${frontendUrl}/login`);
    cy.getByData('email-input').type(email);
    cy.getByData('senha-input').type(senha);
    cy.getByData('botao-entrar').click();

    cy.url({ timeout: 30000 }).should('include', '/itens');
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

  it('bloqueia com 429 e mostra tempo de espera após tentativas seguidas de senha errada', () => {
    // Testes anteriores no arquivo já fizeram sign-in no mesmo IP; espera a
    // janela de 10s do rate limit zerar pra garantir 3 tentativas limpas.
    cy.wait(10000);
    cy.visit(`${frontendUrl}/login`);

    // Rate limit anti-bruteforce da API: 3 tentativas / 10s por IP em
    // /sign-in*. Repetir rápido o suficiente pra estourar na 4a tentativa.
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      cy.getByData('email-input').clear().type(email);
      cy.getByData('senha-input').clear().type('SenhaErrada@999');
      cy.getByData('botao-entrar').click();
      cy.contains('E-mail ou senha incorretos.', { timeout: 10000 }).should(
        'be.visible',
      );
    }

    cy.getByData('email-input').clear().type(email);
    cy.getByData('senha-input').clear().type('SenhaErrada@999');
    cy.getByData('botao-entrar').click();

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
