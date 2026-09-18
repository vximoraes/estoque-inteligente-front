import { criarItem } from '../../support/helpers';

describe('Almoxarifado - listagem e busca', () => {
  beforeEach(() => {
    cy.login();
  });

  it('lista itens de consumo cadastrados', () => {
    criarItem().then((item) => {
      cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
      cy.getByData('search-input').type(item.nome);
      cy.contains(item.nome).should('be.visible');
    });
  });

  it('alterna entre visualização em grid e em tabela', () => {
    cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
    cy.getByData('almoxarifado-view-toggle-table').click();
    cy.getByData('almoxarifado-table').should('be.visible');
    cy.getByData('almoxarifado-view-toggle-cards').click();
    cy.getByData('almoxarifado-grid').should('be.visible');
  });
});
