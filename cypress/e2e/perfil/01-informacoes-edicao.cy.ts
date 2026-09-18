describe('Perfil - informações e edição de nome', () => {
  beforeEach(() => {
    cy.login();
  });

  it('exibe as informações da conta', () => {
    cy.irPara('/perfil', 'perfil-page');
    cy.getByData('perfil-nome').should('be.visible');
    cy.getByData('perfil-email').should('be.visible');
  });

  it('edita o nome do perfil e desfaz a edição', () => {
    cy.irPara('/perfil', 'perfil-page');
    cy.getByData('edit-perfil-button').click();
    cy.getByData('form-editar-nome').should('be.visible');
    cy.getByData('cancel-edit-perfil-button').click();
    cy.getByData('form-editar-nome').should('not.exist');
  });

  it('salva um novo nome e restaura o original em seguida', () => {
    cy.irPara('/perfil', 'perfil-page');
    cy.getByData('perfil-nome-valor')
      .invoke('text')
      .then((nomeOriginal) => {
        cy.getByData('edit-perfil-button').click();
        cy.getByData('input-nome').clear().type('Zz Perfil Editado');
        cy.getByData('save-perfil-button').click();
        cy.getByData('form-editar-nome').should('not.exist');
        cy.getByData('perfil-nome-valor').should(
          'contain.text',
          'Zz Perfil Editado',
        );

        // Restaura o nome original — admin é compartilhado por toda a suíte.
        cy.getByData('edit-perfil-button').click();
        cy.getByData('input-nome').clear().type(nomeOriginal.trim());
        cy.getByData('save-perfil-button').click();
        cy.getByData('form-editar-nome').should('not.exist');
      });
  });
});
