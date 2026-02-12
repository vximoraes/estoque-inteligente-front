describe("Movimentações — Listagem", () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.session("login-admin", () => {
      cy.visit(`${frontendUrl}/login`);

      cy.get("#email").should("be.visible").type(email);
      cy.get("#senha").should("be.visible").type(senha);

      cy.contains("button", "Entrar").should("be.visible").click();

    
      cy.url({ timeout: 15000 }).should("not.include", "/login");
    });

    cy.visit(`${frontendUrl}/relatorios/movimentacoes`);

    cy.get('[data-test="relatorio-movimentacoes-page"]', { timeout: 15000 })
      .should("be.visible");
  });

  it("Carrega cabeçalhos da tabela", () => {
    cy.get('[data-test="table-head-codigo"]').should("be.visible");
    cy.get('[data-test="table-head-produto"]').should("be.visible");
    cy.get('[data-test="table-head-quantidade"]').should("be.visible");
    cy.get('[data-test="table-head-tipo"]').should("be.visible");
    cy.get('[data-test="table-head-localizacao"]').should("be.visible");
    cy.get('[data-test="table-head-data"]').should("be.visible");
  }); 
});
