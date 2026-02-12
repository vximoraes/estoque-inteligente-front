describe("Perfil — Edição de Informações", () => {
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

  it("Abre o modal de edição ao clicar em Editar perfil", () => {
    cy.get('[data-test="edit-perfil-button"]').click();

    cy.get('[data-test="modal-edit-perfil"]')
      .should("be.visible");

    cy.get('[data-test="input-nome"]')
      .should("be.visible")
      .and(($input) => {
        expect($input.val()).to.not.be.empty;
      });

  });

  it("Fecha o modal ao clicar no botão X", () => {
    cy.get('[data-test="edit-perfil-button"]').click();

    cy.get('[data-test="modal-edit-perfil"]')
      .should("be.visible");

    cy.get('[data-test="modal-edit-perfil-close-button"]').click();

    cy.get('[data-test="modal-edit-perfil"]')
      .should("not.exist");
  });

  it("Edita o nome do usuário e salva", () => {
    const novoNome = "Admin Teste " + Date.now();

    cy.get('[data-test="edit-perfil-button"]').click();
    cy.get('[data-test="modal-edit-perfil"]').should("be.visible");

    cy.get('[data-test="input-nome"]')
      .clear()
      .type(novoNome);

    cy.get('[data-test="save-perfil-button"]').click();

    cy.get('[data-test="modal-edit-perfil"]')
      .should("not.exist");

    cy.get('[data-test="perfil-nome"]', { timeout: 5000 })
      .should("contain", novoNome);
  });

  it("Desabilita o botão Salvar enquanto está salvando", () => {
    cy.get('[data-test="edit-perfil-button"]').click();

    cy.get('[data-test="input-nome"]')
      .clear()
      .type("Novo Nome Teste");

    cy.get('[data-test="save-perfil-button"]').click();

    cy.get('[data-test="save-perfil-button"]')
      .should("be.disabled");
  });

  it("Cancela a edição e mantém o nome original", () => {
    cy.get('[data-test="perfil-nome"]')
      .invoke("text")
      .then((nomeOriginal) => {

        cy.get('[data-test="edit-perfil-button"]').click();

        cy.get('[data-test="input-nome"]')
          .clear()
          .type("Nome Temporário");

        cy.get('[data-test="cancel-edit-perfil-button"]').click();

        cy.get('[data-test="modal-edit-perfil"]')
          .should("not.exist");

        cy.get('[data-test="perfil-nome"]')
          .should("contain", nomeOriginal);
      });
  });
});
