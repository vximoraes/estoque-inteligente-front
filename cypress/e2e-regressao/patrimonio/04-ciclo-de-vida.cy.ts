import { criarPatrimonio } from '../../support/helpers';

function acao(numero: string, nome: string) {
  cy.getByData('patrimonio-card-acoes-trigger').first().click();
  cy.getByData(`patrimonio-acao-${nome}`).click();
  cy.getByData('modal-patrimonio-status').should('be.visible');
  cy.getByData('modal-patrimonio-status-confirmar').click();
  cy.getByData('modal-patrimonio-status').should('not.exist');
  cy.contains(numero).should('be.visible');
}

describe('Patrimônio - manutenção, baixa e histórico', () => {
  beforeEach(() => {
    cy.login();
  });

  it('vai para a manutenção, volta, é baixado e o histórico registra tudo', () => {
    criarPatrimonio().then((unidade) => {
      const numero = unidade.numero_patrimonio;
      cy.irPara('/bens/patrimonio', 'patrimonio-page');
      cy.getByData('search-input').type(numero);

      acao(numero, 'manutencao');
      cy.getByData('patrimonio-card-status').should(
        'contain.text',
        'Manutenção',
      );

      acao(numero, 'retornar-manutencao');
      cy.getByData('patrimonio-card-status').should(
        'contain.text',
        'Disponível',
      );

      acao(numero, 'baixar');
      cy.getByData('patrimonio-card-status').should('contain.text', 'Baixado');

      cy.getByData('patrimonio-card-numero').first().click();
      cy.getByData('sheet-detalhe-patrimonio').should('be.visible');
      cy.getByData('sheet-detalhe-historico-tabela').within(() => {
        cy.contains('Cadastro');
        cy.contains('Enviado p/ manutenção');
        cy.contains('Retornou da manutenção');
        cy.contains('Baixa');
      });
      cy.getByData('sheet-detalhe-historico-linha').should('have.length', 4);
    });
  });
});
