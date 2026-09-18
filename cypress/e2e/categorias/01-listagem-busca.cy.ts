import { criarCategoria } from '../../support/helpers';

describe('Categorias - listagem e busca', () => {
  beforeEach(() => {
    cy.login();
  });

  it('lista categorias do tipo permanente por padrão', () => {
    criarCategoria({ tipo: 'permanente' }).then((categoria) => {
      cy.irPara('/categorias', 'categorias-page');
      cy.getByData('search-input').type(categoria.nome);
      cy.contains(categoria.nome).should('be.visible');
    });
  });

  it('alterna para o tipo consumo e busca por nome', () => {
    criarCategoria({ tipo: 'consumo' }).then((categoria) => {
      cy.irPara('/categorias', 'categorias-page');
      cy.getByData('categorias-tab-consumo').click();
      cy.getByData('search-input').type(categoria.nome);
      cy.contains(categoria.nome).should('be.visible');
    });
  });
});
