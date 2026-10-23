import { criarLocalizacao, criarPatrimonio } from '../../support/helpers';

describe('Relatórios - filtros e exportação', () => {
  beforeEach(() => {
    cy.login();
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

        // O nome sai com o dia no fuso salvo do usuário, que outras specs podem ter trocado.
        cy.api('GET', '/api/auth/get-session').then(({ body }) => {
          const dia = new Intl.DateTimeFormat('en-CA', {
            timeZone: body?.user?.fuso_horario || 'UTC',
          }).format(new Date());
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
});
