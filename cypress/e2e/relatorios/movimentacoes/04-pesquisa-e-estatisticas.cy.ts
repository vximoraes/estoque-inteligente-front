describe('Movimentações — Pesquisa e Estatísticas', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.login(email, senha);

    cy.visit(`${frontendUrl}/relatorios/movimentacoes`);

    cy.get('[data-test="relatorio-movimentacoes-page"]', {
      timeout: 15000,
    }).should('be.visible');
  });

  it('Pesquisa por nome do produto', () => {
    cy.get('[data-test="search-input"]').first().type('entrada', { delay: 0 });

    cy.wait(500);

    cy.get('[data-test="search-input"]')
      .first()
      .should('have.value', 'entrada');
  });

  it('Exibe estado vazio quando a pesquisa não encontra resultados', () => {
    cy.get('[data-test="search-input"]').first().type('algoquenaoexiste123');

    cy.get('[data-test="empty-state"]', { timeout: 20000 }).should(
      'be.visible',
    );
  });

  it('Exibe estatísticas com total, entradas e saídas', () => {
    cy.get('[data-test="stat-total-movimentacoes"]')
      .should('be.visible')
      .invoke('text')
      .should('match', /\d+/);

    cy.get('[data-test="stat-entradas"]')
      .should('be.visible')
      .invoke('text')
      .should('match', /\d+/);

    cy.get('[data-test="stat-saidas"]')
      .should('be.visible')
      .invoke('text')
      .should('match', /\d+/);
  });

  it('Estatísticas atualizam após pesquisa', () => {
    cy.get('[data-test="stat-total-movimentacoes"]')
      .invoke('text')
      .then((valorAntes) => {
        cy.get('[data-test="search-input"]').first().type('entrada');

        cy.wait(700);

        cy.get('[data-test="stat-total-movimentacoes"]')
          .invoke('text')
          .should((valorDepois) => {
            expect(valorDepois).not.to.eq(valorAntes);
          });
      });
  });
});
