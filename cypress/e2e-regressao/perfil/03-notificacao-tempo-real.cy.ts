import {
  criarItem,
  criarLocalizacao,
  criarMovimentacao,
} from '../../support/helpers';

describe('Notificações - tempo real', () => {
  beforeEach(() => {
    cy.login();
  });

  it('o contador do cabeçalho sobe sozinho quando um item zera', () => {
    criarItem().then((item) => {
      criarLocalizacao().then((localizacao) => {
        criarMovimentacao({
          item: item._id,
          localizacao: localizacao._id,
          quantidade: '2',
        });
        cy.api('PATCH', '/notificacoes/visualizar-todas');

        cy.irPara('/bens/patrimonio', 'patrimonio-page');
        cy.getByData('contador-notificacoes').should('not.exist');

        cy.api('POST', '/movimentacoes', {
          tipo: 'saida',
          quantidade: '2',
          item: item._id,
          localizacao: localizacao._id,
        })
          .its('status')
          .should('eq', 201);

        cy.getByData('contador-notificacoes', { timeout: 15000 }).should(
          'have.text',
          '1',
        );
        cy.getByData('botao-notificacoes').click();
        cy.getByData('lista-notificacoes').should(
          'contain.text',
          `${item.nome} está indisponível`,
        );
      });
    });
  });
});
