describe('Permissões na interface', () => {
  it('admin vê o menu de Usuários e abre a tela', () => {
    cy.login();
    cy.irPara('/bens/patrimonio', 'patrimonio-page');
    cy.getByData('sidebar-btn-usuarios').should('exist');
    cy.irPara('/usuarios', 'usuarios-page');
  });

  it('usuário sem permissão de usuários não vê o menu nem abre a tela', () => {
    cy.login(
      Cypress.env('TEST_USER_COMUM_EMAIL'),
      Cypress.env('TEST_USER_COMUM_PASSWORD'),
    );
    cy.irPara('/bens/patrimonio', 'patrimonio-page');
    cy.getByData('sidebar-btn-patrimonio').should('exist');
    cy.getByData('sidebar-btn-usuarios').should('not.exist');

    cy.visit('/usuarios', { failOnStatusCode: false });
    cy.getByData('usuarios-page').should('not.exist');
  });
});
