describe("Perfil — Informações e Estatísticas", () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.session([email, senha], () => {
      cy.visit(`${frontendUrl}/`);

      cy.get("#email").type(email);
      cy.get("#senha").type(senha);
      cy.contains("button", "Entrar").click();

      cy.url().should('include', '/componentes');
    });

    cy.visit(`${frontendUrl}/perfil`);
    cy.wait(1000);

    cy.get('[data-test="loading-perfil-page"]', { timeout: 5000 }).should('not.exist');

    cy.get('[data-test="perfil-page"]', { timeout: 15000 })
      .should("be.visible");
  });

  it("Exibe nome, email e avatar", () => {
    cy.get('[data-test="perfil-nome"]').should("be.visible");
    cy.get('[data-test="perfil-email"]').should("be.visible");

    cy.get('[data-test="perfil-avatar-container"]').should("exist");
  });

  it("Mostra estatísticas do usuário", () => {
    cy.get('[data-test="total-componentes-value"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /\d+/);

    cy.get('[data-test="total-movimentacoes-value"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /\d+/);

    cy.get('[data-test="total-orcamentos-value"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /\d+/);
  });

  it("Renderiza área de notificações", () => {
    cy.get('[data-test="notificacoes-section"]')
      .should("be.visible");

    cy.get('[data-test="notificacoes-section"]').within(() => {

      cy.get('[data-test="notificacoes-list"], [data-test="no-notificacoes-message"]')
        .then(($el) => {
          const temLista = $el.filter('[data-test="notificacoes-list"]').length > 0;
          const temVazio = $el.filter('[data-test="no-notificacoes-message"]').length > 0;

          expect(
            temLista || temVazio,
            "Deve existir lista ou mensagem de 'nenhuma notificação'"
          ).to.be.true;

          if (temLista) {
            cy.get('[data-test="notificacoes-list"]').should("be.visible");
          } else {
            cy.get('[data-test="no-notificacoes-message"]').should("be.visible");
          }
        });
    });
  });
});
