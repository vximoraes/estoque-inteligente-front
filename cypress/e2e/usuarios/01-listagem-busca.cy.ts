import { convidarUsuario } from '../../support/helpers';

describe('Usuários - listagem e busca', () => {
  beforeEach(() => {
    cy.login();
  });

  it('lista usuários convidados', () => {
    convidarUsuario().then((usuario) => {
      cy.irPara('/usuarios', 'usuarios-page');
      cy.getByData('search-input').type(usuario.nome);
      cy.contains(usuario.nome).should('be.visible');
    });
  });
});
