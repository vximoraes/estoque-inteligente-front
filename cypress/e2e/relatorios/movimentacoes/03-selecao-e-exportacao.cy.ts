describe('Movimentações — Seleção e Exportação', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.session('login-admin', () => {
      cy.visit(`${frontendUrl}/login`);

      cy.get('#email').type(email);
      cy.get('#senha').type(senha);
      cy.contains('button', 'Entrar').click();

      cy.location('pathname').should('not.include', '/login');
    });

    cy.visit(`${frontendUrl}/relatorios/movimentacoes`);

    cy.get('[data-test="relatorio-movimentacoes-page"]', {
      timeout: 15000,
    }).should('be.visible');
  });

  it('Seleciona itens e exporta PDF (sem leitura do arquivo)', () => {
    cy.get('[data-test^="checkbox-item-"]')
      .should('have.length.greaterThan', 1)
      .as('checkboxes');

    cy.get('@checkboxes').eq(0).click();
    cy.get('@checkboxes').eq(1).click();

    cy.get('[data-test="exportar-button"]').should('not.be.disabled').click();

    cy.get('[data-test="modal-exportar-overlay"]').should('exist');

    cy.get('[data-test="filename-input"]').clear().type('movimentacoes-teste');

    cy.get('[data-test="format-radio-pdf"]').check({ force: true });

    cy.get('[data-test="modal-exportar-export-button"]').click();

    cy.get('[data-test="modal-exportar-overlay"]').should('not.exist');
  });

  it('Seleciona itens e exporta CSV (sem leitura do arquivo)', () => {
    cy.get('[data-test^="checkbox-item-"]').first().click();

    cy.get('[data-test="exportar-button"]').click();

    cy.get('[data-test="filename-input"]').clear().type('movimentacoes-csv');

    cy.get('[data-test="format-radio-csv"]').check({ force: true });
    cy.get('[data-test="modal-exportar-export-button"]').click();

    cy.get('[data-test="modal-exportar-overlay"]').should('not.exist');
  });
});
