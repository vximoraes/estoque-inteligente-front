describe("Movimentações — Pesquisa e Estatísticas", () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.session("login-admin", () => {
      cy.visit(`${frontendUrl}/login`);

      cy.get("#email").type(email);
      cy.get("#senha").type(senha);
      cy.contains("button", "Entrar").click();

      cy.location("pathname").should("not.include", "/login");
    });

    cy.visit(`${frontendUrl}/relatorios/movimentacoes`);

    cy.get('[data-test="relatorio-movimentacoes-page"]', { timeout: 15000 })
      .should("be.visible");
  });

  it("Pesquisa por nome do produto", () => {
    cy.get('[data-test="search-input"]').first().type("entrada", { delay: 0 });

    cy.wait(500);

    cy.get('[data-test="search-input"]').first().should("have.value", "entrada");
  });

  it("Exibe estado vazio quando a pesquisa não encontra resultados", () => {
    cy.get('[data-test="search-input"]').first().type("algoquenaoexiste123");

    cy.get('[data-test="empty-state"]').should("be.visible");
  });

  it("Exibe estatísticas com total, entradas e saídas", () => {
    cy.get('[data-test="stat-total-movimentacoes"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /\d+/);

    cy.get('[data-test="stat-entradas"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /\d+/);

    cy.get('[data-test="stat-saidas"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /\d+/);
  });

  it("Estatísticas atualizam após pesquisa", () => {
    cy.get('[data-test="stat-total-movimentacoes"]')
      .invoke("text")
      .then((valorAntes) => {
        cy.get('[data-test="search-input"]').first().type("entrada");

        cy.wait(700);

        cy.get('[data-test="stat-total-movimentacoes"]')
          .invoke("text")
          .should((valorDepois) => {
            expect(valorDepois).not.to.eq(valorAntes);
          });
      });
  });

  it("Abre e fecha o bloco de estatísticas no modo mobile", () => {
    cy.viewport(390, 844);
    cy.get('[data-test="toggle-stats-button"]').first().should("be.visible").click();
    cy.get('[data-test="stats-grid"]').first().should("be.visible");
    cy.get('[data-test="toggle-stats-button"]').first().click();
    cy.get('[data-test="stats-grid"]').first().should("not.be.visible");
  });
});
