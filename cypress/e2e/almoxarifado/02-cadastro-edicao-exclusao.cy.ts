import { criarCategoria, criarItem, sufixoUnico } from '../../support/helpers';

describe('Almoxarifado - cadastro, edição e exclusão de item', () => {
  beforeEach(() => {
    cy.login();
  });

  it('cadastra um item de consumo válido', () => {
    criarCategoria({ tipo: 'consumo' }).then((categoria) => {
      const nome = sufixoUnico('zz-item');

      cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
      cy.getByData('adicionar-button').click();
      cy.getByData('modal-cadastrar-item-consumo').should('be.visible');

      cy.getByData('input-nome-item').type(nome);
      cy.getByData('botao-selecionar-categoria').click();
      cy.getByData('input-pesquisa-categoria').type(categoria.nome);
      cy.get('[data-test="categoria-option"]').contains(categoria.nome).click();
      cy.getByData('input-estoque-minimo').type('5');

      cy.getByData('botao-salvar').click();
      cy.getByData('modal-cadastrar-item-consumo').should('not.exist');

      cy.getByData('search-input').type(nome);
      cy.contains(nome).should('be.visible');
    });
  });

  it('exibe erro ao tentar cadastrar sem nome', () => {
    cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
    cy.getByData('adicionar-button').click();
    cy.getByData('botao-salvar').click();
    cy.getByData('modal-cadastrar-item-consumo').should('be.visible');
  });

  it('edita o nome de um item existente', () => {
    criarItem().then((item) => {
      cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
      cy.getByData('search-input').type(item.nome);
      cy.contains(item.nome).should('be.visible');
      cy.getByData('actions-menu-button').click();
      cy.getByData('edit-button').click();

      cy.getByData('modal-editar-item').should('be.visible');
      const novoNome = sufixoUnico('zz-item-editado');
      cy.getByData('input-nome-item').clear().type(novoNome);
      cy.getByData('botao-salvar').click();
      cy.getByData('modal-editar-item').should('not.exist');

      cy.getByData('search-input').clear();
      cy.getByData('search-input').should('have.value', '');
      cy.getByData('search-input').type(novoNome);
      cy.contains(novoNome).should('be.visible');
    });
  });

  it('exclui um item existente', () => {
    criarItem().then((item) => {
      cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
      cy.getByData('search-input').type(item.nome);
      cy.contains(item.nome).should('be.visible');
      cy.getByData('actions-menu-button').click();
      cy.getByData('delete-button').click();

      cy.getByData('modal-excluir-backdrop').should('be.visible');
      cy.getByData('modal-excluir-confirmar').click();
      cy.getByData('modal-excluir-backdrop').should('not.exist');

      cy.contains(item.nome).should('not.exist');
    });
  });
});
