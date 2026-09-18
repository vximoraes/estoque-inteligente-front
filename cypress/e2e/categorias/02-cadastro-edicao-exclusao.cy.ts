import { criarCategoria, sufixoUnico } from '../../support/helpers';

describe('Categorias - cadastro, edição e exclusão', () => {
  beforeEach(() => {
    cy.login();
  });

  it('cadastra uma categoria permanente válida', () => {
    const nome = sufixoUnico('zz-categoria');
    cy.irPara('/categorias', 'categorias-page');
    cy.getByData('adicionar-button').click();
    cy.getByData('modal-cadastrar-categoria').should('be.visible');

    cy.getByData('nome-input').type(nome);
    cy.getByData('modal-cadastrar-categoria-confirmar').click();
    cy.getByData('modal-cadastrar-categoria').should('not.exist');

    cy.getByData('search-input').type(nome);
    cy.contains(nome).should('be.visible');
  });

  it('exibe erro ao tentar cadastrar sem nome', () => {
    cy.irPara('/categorias', 'categorias-page');
    cy.getByData('adicionar-button').click();
    cy.getByData('modal-cadastrar-categoria-confirmar').click();
    cy.getByData('modal-cadastrar-categoria').should('be.visible');
  });

  it('edita o nome de uma categoria existente', () => {
    criarCategoria({ tipo: 'permanente' }).then((categoria) => {
      cy.irPara('/categorias', 'categorias-page');
      cy.getByData('search-input').type(categoria.nome);
      cy.contains(categoria.nome).should('be.visible');
      cy.getByData('edit-button').first().click();

      cy.getByData('modal-editar-categoria').should('be.visible');
      const novoNome = sufixoUnico('zz-categoria-editada');
      cy.getByData('nome-input').clear().type(novoNome);
      cy.getByData('modal-editar-categoria-confirmar').click();
      cy.getByData('modal-editar-categoria').should('not.exist');

      // A busca ainda filtra pelo nome antigo — atualizar o filtro.
      cy.getByData('search-input').clear();
      cy.getByData('search-input').should('have.value', '');
      cy.getByData('search-input').type(novoNome);
      cy.contains(novoNome).should('be.visible');
    });
  });

  it('exclui uma categoria existente', () => {
    criarCategoria({ tipo: 'permanente' }).then((categoria) => {
      cy.irPara('/categorias', 'categorias-page');
      cy.getByData('search-input').type(categoria.nome);
      cy.contains(categoria.nome).should('be.visible');
      cy.getByData('delete-button').first().click();

      cy.getByData('modal-excluir-categoria').should('be.visible');
      cy.getByData('modal-excluir-categoria-confirmar').click();
      cy.getByData('modal-excluir-categoria').should('not.exist');

      cy.contains(categoria.nome).should('not.exist');
    });
  });
});
