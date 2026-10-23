import { criarCategoria, sufixoUnico } from '../../support/helpers';

function abrirCadastroDeItem(nome: string, categoriaNome: string) {
  cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
  cy.getByData('adicionar-button').click();
  cy.getByData('modal-cadastrar-item-consumo').should('be.visible');
  cy.getByData('input-nome-item').type(nome);
  cy.getByData('botao-selecionar-categoria').click();
  cy.getByData('input-pesquisa-categoria').type(categoriaNome);
  cy.get('[data-test="categoria-option"]').contains(categoriaNome).click();
  cy.getByData('input-estoque-minimo').type('5');
}

describe('Imagens - upload', () => {
  beforeEach(() => {
    cy.login();
  });

  it('cadastra item com imagem PNG e a API guarda a imagem', () => {
    criarCategoria({ tipo: 'consumo' }).then((categoria) => {
      const nome = sufixoUnico('zz-item');
      abrirCadastroDeItem(nome, categoria.nome);
      cy.getByData('campo-imagem-input').selectFile(
        'cypress/fixtures/imagem.png',
        {
          force: true,
        },
      );
      cy.contains('Imagem selecionada').should('be.visible');
      cy.getByData('botao-salvar').click();
      cy.getByData('modal-cadastrar-item-consumo').should('not.exist');

      cy.api('GET', `/itens?nome=${encodeURIComponent(nome)}`)
        .its('body.data.docs.0.imagem')
        .should('be.a', 'string')
        .and('not.be.empty');
    });
  });

  it('recusa GIF antes de enviar, com a mensagem do formato aceito', () => {
    criarCategoria({ tipo: 'consumo' }).then((categoria) => {
      abrirCadastroDeItem(sufixoUnico('zz-item'), categoria.nome);
      cy.getByData('campo-imagem-input').selectFile(
        'cypress/fixtures/imagem.gif',
        {
          force: true,
        },
      );
      cy.getByData('erro-imagem').should(
        'have.text',
        'Use uma imagem PNG ou JPG.',
      );
      cy.contains('Imagem selecionada').should('not.exist');
    });
  });

  it('recusa imagem acima de 5 MB', () => {
    criarCategoria({ tipo: 'consumo' }).then((categoria) => {
      abrirCadastroDeItem(sufixoUnico('zz-item'), categoria.nome);
      cy.getByData('campo-imagem-input').selectFile(
        {
          contents: Cypress.Buffer.alloc(6 * 1024 * 1024),
          fileName: 'grande.png',
          mimeType: 'image/png',
        },
        { force: true },
      );
      cy.getByData('erro-imagem').should(
        'have.text',
        'A imagem deve ter no máximo 5 MB.',
      );
    });
  });

  it('troca e remove a foto de perfil', () => {
    cy.irPara('/perfil', 'perfil-page');
    cy.getByData('edit-avatar-button').click();
    cy.getByData('modal-edit-foto').should('be.visible');
    cy.getByData('foto-file-input').selectFile('cypress/fixtures/imagem.png', {
      force: true,
    });
    cy.getByData('foto-preview-image').should('be.visible');
    cy.getByData('save-foto-button').click();
    cy.getByData('modal-edit-foto').should('not.exist');

    cy.api('GET', '/api/auth/get-session')
      .its('body.user.id')
      .then((id) => {
        cy.api('GET', `/usuarios/${id}`)
          .its('body.data.fotoPerfil')
          .should('not.be.empty');
        cy.api('DELETE', `/usuarios/${id}/foto`)
          .its('status')
          .should('eq', 200);
      });
  });
});
