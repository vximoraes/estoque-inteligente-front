import { criarLocalizacao } from '../../support/helpers';

describe('Localizações - listagem e busca', () => {
  beforeEach(() => {
    cy.login();
  });

  it('lista localizações cadastradas', () => {
    criarLocalizacao().then((localizacao) => {
      cy.irPara('/localizacoes', 'localizacoes-page');
      cy.getByData('search-input').type(localizacao.nome);
      cy.contains(localizacao.nome).should('be.visible');
    });
  });
});
