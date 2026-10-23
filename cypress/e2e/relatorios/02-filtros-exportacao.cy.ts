import { criarLocalizacao } from '../../support/helpers';

describe('Relatórios - filtros e exportação', () => {
  beforeEach(() => {
    cy.login();
  });

  it('filtra o relatório de patrimônio por localização', () => {
    criarLocalizacao().then((localizacao) => {
      cy.irPara('/relatorios', 'relatorios-page');
      cy.getByData('filtro-localizacao-trigger').click();
      cy.getByData('filtro-localizacao-pesquisa').type(localizacao.nome);
      cy.get('[data-test="filtro-localizacao-opcao"]')
        .contains(localizacao.nome)
        .click();
    });
  });

  it('abre e cancela o modal de exportação do relatório de patrimônio', () => {
    cy.irPara('/relatorios', 'relatorios-page');
    // Exportar exige ao menos uma unidade selecionada.
    cy.getByData('checkbox-select-all').click();
    cy.getByData('exportar-button').click();
    cy.getByData('modal-exportar-overlay').should('be.visible');

    cy.getByData('format-radio-csv').click();
    cy.getByData('modal-exportar-cancel-button').click();
    cy.getByData('modal-exportar-overlay').should('not.exist');
  });

  it('abre o seletor de período do relatório de movimentações', () => {
    cy.irPara('/relatorios', 'relatorios-page');
    cy.getByData('relatorios-tab-movimentacoes').click();
    cy.getByData('relatorio-movimentacoes-page').should('be.visible');
    cy.getByData('filtro-periodo-trigger').click();
    cy.getByData('filtro-periodo-calendar').should('be.visible');
  });
});
