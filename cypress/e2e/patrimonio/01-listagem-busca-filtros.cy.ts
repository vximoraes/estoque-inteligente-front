import { criarLocalizacao, criarPatrimonio } from '../../support/helpers';

describe('Patrimônio - listagem, busca e filtros', () => {
  beforeEach(() => {
    cy.login();
  });

  it('lista patrimônios cadastrados', () => {
    criarPatrimonio().then((patrimonio) => {
      cy.irPara('/bens/patrimonio', 'patrimonio-page');
      cy.getByData('search-input').type(patrimonio.numero_patrimonio);
      cy.contains(patrimonio.numero_patrimonio).should('be.visible');
    });
  });

  it('alterna entre visualização em grid e em tabela', () => {
    cy.irPara('/bens/patrimonio', 'patrimonio-page');
    cy.getByData('patrimonio-view-toggle-table').click();
    cy.getByData('patrimonio-table').should('be.visible');
    cy.getByData('patrimonio-view-toggle-cards').click();
    cy.getByData('patrimonio-grid').should('be.visible');
  });

  it('filtra por localização', () => {
    criarLocalizacao().then((localizacao) => {
      criarPatrimonio({ localizacao: localizacao._id }).then((patrimonio) => {
        cy.irPara('/bens/patrimonio', 'patrimonio-page');
        cy.getByData('filtro-localizacao').click();
        cy.get('[role="option"]').contains(localizacao.nome).click();
        cy.contains(patrimonio.numero_patrimonio).should('be.visible');
      });
    });
  });
});
