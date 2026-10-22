import { criarLocalizacao, criarPatrimonio } from '../../support/helpers';

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

  it('gera o CSV do relatório de patrimônio com as unidades selecionadas', () => {
    criarLocalizacao().then((localizacao) => {
      criarPatrimonio({ localizacao: localizacao._id }).then((unidade) => {
        const arquivo = `zz-relatorio-${Cypress._.random(1e6, 1e7)}`;
        cy.irPara('/relatorios', 'relatorios-page');
        cy.getByData('filtro-localizacao-trigger').click();
        cy.getByData('filtro-localizacao-pesquisa').type(localizacao.nome);
        cy.get('[data-test="filtro-localizacao-opcao"]')
          .contains(localizacao.nome)
          .click();
        cy.contains('[data-test="patrimonio-row"]', unidade.numero_patrimonio);

        cy.getByData('checkbox-select-all').click();
        cy.getByData('exportar-button').click();
        cy.getByData('format-radio-csv').click();
        cy.getByData('filename-input').clear().type(arquivo);
        cy.getByData('modal-exportar-export-button').click();

        // O nome sai com o dia no fuso do usuário; o admin do seed fica em UTC.
        const dia = new Date().toISOString().slice(0, 10);
        cy.readFile(`cypress/downloads/${arquivo}-${dia}.csv`).then(
          (conteudo) => {
            expect(conteudo).to.contain('"Nº PATRIMÔNIO";"MODELO"');
            expect(conteudo).to.contain(`"${unidade.numero_patrimonio}"`);
            expect(conteudo).to.contain(localizacao.nome);
          },
        );
      });
    });
  });
});
