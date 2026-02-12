/// <reference types="cypress" />

describe("Movimentações — Filtros", () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.session("login-admin", () => {
      cy.visit(`${frontendUrl}/login`);

      cy.get("#email").should("be.visible").type(email);
      cy.get("#senha").should("be.visible").type(senha);
      cy.contains("button", "Entrar").should("be.visible").click();

      cy.location("pathname", { timeout: 10000 }).should("not.include", "/login");
    });

    cy.visit(`${frontendUrl}/relatorios/movimentacoes`);
    cy.get('[data-test="relatorio-movimentacoes-page"]').should("be.visible");
  });

//teste 01
  it("Abre e fecha o modal de filtros", () => {
    cy.get('[data-test="filtros-button"]').click();

    cy.get('[data-test="modal-filtros-content"]').should("exist");

    cy.get('[data-test="modal-filtros-close-button"]').click();

    cy.get('[data-test="modal-filtros-content"]').should("not.exist");
  });

 //teste 02
  it("Aplica filtro de Entrada e lista somente entradas", () => {
    cy.get('[data-test="filtros-button"]').click();
    cy.get('[data-test="filtro-status-dropdown"]').click();

    cy.get('[data-test="filtro-status-option-entrada"]').click();
    cy.get('[data-test="aplicar-filtros-button"]').click();

    cy.get('[data-test="filter-tag-tipo"]')
      .should("exist")
      .and(($el) => {
        const text = $el.text().toLowerCase();
        expect(text).to.contain("entrada");
      });

    cy.get('[data-test="movimentacoes-table-body"] tr').each(($row) => {
      cy.wrap($row)
        .find('[data-test^="badge-tipo-"]')
        .invoke("text")
        .then((t) => {
          expect(t.trim().toLowerCase()).to.equal("entrada");
        });
    });
  });

    //teste 03
  it("Remove o filtro de tipo pelo botão X", () => {
    cy.get('[data-test="filtros-button"]').click();
    cy.get('[data-test="filtro-status-dropdown"]').click();

    cy.get('[data-test="filtro-status-option-entrada"]').click();
    cy.get('[data-test="aplicar-filtros-button"]').click();

    cy.get('[data-test="remove-tipo-filter"]').click();

    cy.get('[data-test="filter-tag-tipo"]').should("not.exist");
  });

    //teste 04
  it("Aplica filtro de Saída e lista somente saídas", () => {
    cy.get('[data-test="filtros-button"]').click();
    cy.get('[data-test="filtro-status-dropdown"]').click();

    cy.get('[data-test="filtro-status-option-saída"], [data-test="filtro-status-option-saida"]').click();
    cy.get('[data-test="aplicar-filtros-button"]').click();

    cy.get('[data-test="filter-tag-tipo"]')
      .should("exist")
      .and(($el) => {
        const text = $el.text().toLowerCase();
        expect(text).to.contain("saida"); 
      });


    cy.get('[data-test="movimentacoes-table-body"] tr').each(($row) => {
      cy.wrap($row)
        .find('[data-test^="badge-tipo-"]')
        .invoke("text")
        .then((t) => {
          const normalized = t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          expect(normalized).to.equal("saida");
        });
    });
  });
});
