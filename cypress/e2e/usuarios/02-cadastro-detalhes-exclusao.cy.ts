import { convidarUsuario, sufixoUnico } from '../../support/helpers';

describe('Usuários - convite, detalhes e exclusão', () => {
  beforeEach(() => {
    cy.login();
  });

  it('convida um novo usuário', () => {
    // O campo nome do formulário valida capitalização (regex do zod) — não
    // aceita o padrão zz-usuario-<numero> usado nas outras fábricas.
    // Unicidade real vem do e-mail; o nome não precisa ser único.
    const nome = 'Zz Usuario Teste';
    const email = `${sufixoUnico('zz-usuario')}@teste.com`;

    cy.irPara('/usuarios', 'usuarios-page');
    cy.getByData('cadastrar-usuario-button').click();
    cy.getByData('modal-cadastrar-usuario').should('be.visible');

    cy.getByData('nome-input').type(nome);
    cy.getByData('email-input').type(email);
    cy.getByData('modal-cadastrar-confirmar').click();
    cy.getByData('modal-cadastrar-usuario').should('not.exist');

    cy.getByData('search-input').type(nome);
    cy.contains(nome).should('be.visible');
  });

  it('exibe erro ao tentar convidar sem e-mail', () => {
    cy.irPara('/usuarios', 'usuarios-page');
    cy.getByData('cadastrar-usuario-button').click();
    cy.getByData('nome-input').type('Zz Usuario Teste');
    cy.getByData('modal-cadastrar-confirmar').click();
    cy.getByData('modal-cadastrar-usuario').should('be.visible');
  });

  it('visualiza detalhes de um usuário convidado', () => {
    convidarUsuario().then((usuario) => {
      cy.irPara('/usuarios', 'usuarios-page');
      cy.getByData('search-input').type(usuario.nome);
      cy.contains(usuario.nome).should('be.visible');
      cy.getByData('visualizar-button').first().click();

      cy.getByData('modal-detalhes-usuario').should('be.visible');
      cy.getByData('modal-detalhes-email').should(
        'contain.text',
        usuario.email,
      );
    });
  });

  it('exclui um usuário convidado', () => {
    convidarUsuario().then((usuario) => {
      cy.irPara('/usuarios', 'usuarios-page');
      cy.getByData('search-input').type(usuario.nome);
      cy.contains(usuario.nome).should('be.visible');
      cy.getByData('excluir-button').first().click();

      cy.getByData('modal-excluir-usuario').should('be.visible');
      cy.getByData('modal-excluir-confirmar').click();
      cy.getByData('modal-excluir-usuario').should('not.exist');

      cy.contains(usuario.nome).should('not.exist');
    });
  });
});
