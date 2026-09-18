import { criarItem, criarLocalizacao } from '../../support/helpers';

describe('Almoxarifado - entrada e saída de estoque', () => {
  beforeEach(() => {
    cy.login();
  });

  it('registra entrada de estoque em uma localização', () => {
    criarItem().then((item) => {
      criarLocalizacao().then((localizacao) => {
        cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
        cy.getByData('search-input').type(item.nome);
        cy.contains(item.nome).should('be.visible');

        cy.getByData('entrada-icon').first().click();
        cy.getByData('modal-entrada-content').should('be.visible');

        cy.getByData('modal-entrada-quantidade-input').type('20');
        cy.getByData('modal-entrada-localizacao-dropdown').click();
        cy.contains(localizacao.nome).click();
        cy.getByData('modal-entrada-confirmar').click();
        cy.getByData('modal-entrada-content').should('not.exist');
      });
    });
  });

  it('registra saída de estoque após uma entrada', () => {
    criarItem().then((item) => {
      criarLocalizacao().then((localizacao) => {
        cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
        cy.getByData('search-input').type(item.nome);
        cy.contains(item.nome).should('be.visible');

        cy.getByData('entrada-icon').first().click();
        cy.getByData('modal-entrada-quantidade-input').type('20');
        cy.getByData('modal-entrada-localizacao-dropdown').click();
        cy.contains(localizacao.nome).click();
        cy.getByData('modal-entrada-confirmar').click();
        cy.getByData('modal-entrada-content').should('not.exist');

        cy.getByData('saida-icon').first().should('not.be.disabled').click();
        cy.getByData('modal-saida-content').should('be.visible');
        cy.getByData('modal-saida-quantidade-input').type('5');
        cy.getByData('modal-saida-localizacao-dropdown').click();
        cy.contains(localizacao.nome).click();
        cy.getByData('modal-saida-confirmar').click();
        cy.getByData('modal-saida-content').should('not.exist');
      });
    });
  });
});
