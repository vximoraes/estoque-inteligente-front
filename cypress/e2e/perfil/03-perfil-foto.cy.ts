describe("Perfil — Edição de Foto", () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.session([email, senha], () => {
      cy.visit(`${frontendUrl}/`);
      cy.get("#email").type(email);
      cy.get("#senha").type(senha);
      cy.contains("button", "Entrar").click();
      cy.url().should('include', '/itens');
    });

    cy.visit(`${frontendUrl}/perfil`);
    cy.wait(1000);

    cy.get('[data-test="loading-perfil-page"]', { timeout: 5000 }).should('not.exist');
    cy.get('[data-test="perfil-page"]').should("be.visible");
  });

  it("Abre o modal ao clicar em editar foto", () => {
    cy.get('[data-test="edit-avatar-button"]').click();
    cy.get('[data-test="modal-edit-foto"]').should("be.visible");
  });

  it("Fecha o modal ao clicar no botão X", () => {
    cy.get('[data-test="edit-avatar-button"]').click();
    cy.get('[data-test="modal-edit-foto-close-button"]').click();
    cy.get('[data-test="modal-edit-foto"]').should("not.exist");
  });

  it("Permite selecionar um arquivo de imagem", () => {
    cy.get('[data-test="edit-avatar-button"]').click();

    cy.get('[data-test="foto-file-input"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: "foto-teste.png",
        mimeType: "image/png",
      },
      { force: true }
    );

    cy.get('[data-test="save-foto-button"]').should("be.visible");
  });

  it("Desabilita botão de salvar durante upload", () => {
    cy.get('[data-test="edit-avatar-button"]').click();

    cy.get('[data-test="foto-file-input"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: "foto-teste.png",
        mimeType: "image/png",
      },
      { force: true }
    );

    cy.intercept("PUT", "**/usuarios/**/foto", (req) => {
      req.reply((res) => {
        res.delay = 1500;
        res.send({ data: { fotoPerfil: "/teste.png" } });
      });
    }).as("uploadFoto");

    cy.get('[data-test="save-foto-button"]').click().should("be.disabled");

    cy.wait("@uploadFoto");

    cy.get('[data-test="modal-edit-foto"]').should("not.exist");
  });

  it("Abre modal de confirmação e permite cancelar", () => {
    cy.get('[data-test="edit-avatar-button"]').click();

    cy.get('[data-test="remove-foto-button"]').click();
    cy.get('[data-test="modal-confirm-remove-foto"]').should("be.visible");

    cy.get('[data-test="cancel-remove-foto-button"]').click();
    cy.get('[data-test="modal-confirm-remove-foto"]').should("not.exist");
  });
});
