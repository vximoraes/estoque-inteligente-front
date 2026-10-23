import { criarPatrimonio, sufixoUnico } from '../../support/helpers';

function statusDoPatrimonio(id: string) {
  return cy.api('GET', `/patrimonios/${id}`).its('body.data.status');
}

function emprestarPelaTela(numero: string, solicitante: string) {
  cy.irPara('/emprestimos', 'emprestimos-page');
  cy.getByData('emprestimos-tab-unidade').click();
  cy.getByData('adicionar-button').click();
  cy.getByData('modal-selecionar-patrimonio').should('be.visible');
  cy.getByData('modal-selecionar-patrimonio-pesquisa').type(numero);
  cy.contains(
    '[data-test="modal-selecionar-patrimonio-opcao"]',
    numero,
  ).click();

  cy.getByData('modal-emprestar-unidade').should('be.visible');
  cy.getByData('modal-emprestar-unidade-solicitante').type(solicitante);
  const prevista = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const local = new Date(
    prevista.getTime() - prevista.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  cy.getByData('modal-emprestar-unidade-data-prevista').type(local);
  cy.getByData('modal-emprestar-unidade-confirmar').click();
  cy.getByData('modal-emprestar-unidade').should('not.exist');
}

describe('Empréstimos - patrimônio (unidade)', () => {
  beforeEach(() => {
    cy.login();
  });

  it('empresta, devolve e desfaz a devolução de uma unidade', () => {
    criarPatrimonio().then((unidade) => {
      const solicitante = sufixoUnico('zz-solicitante');
      emprestarPelaTela(unidade.numero_patrimonio, solicitante);

      cy.getByData('search-input').type(solicitante);
      cy.contains('tr', solicitante).should('be.visible');
      statusDoPatrimonio(unidade._id).should('eq', 'Emprestado');

      cy.contains('tr', solicitante)
        .find('[data-test="devolver-button"]')
        .click();
      cy.getByData('modal-devolver-item-confirmar').click();
      cy.getByData('modal-devolver-item').should('not.exist');
      statusDoPatrimonio(unidade._id).should('eq', 'Disponível');

      cy.contains('tr', solicitante)
        .find('[data-test="editar-button"]')
        .click();
      cy.getByData('modal-editar-emprestimo-desfazer-devolucao').click();
      cy.getByData(
        'modal-editar-emprestimo-desfazer-devolucao-confirmar',
      ).click();
      statusDoPatrimonio(unidade._id).should('eq', 'Emprestado');
    });
  });

  it('mostra como atrasado o empréstimo que a API marca como vencido', () => {
    criarPatrimonio().then((unidade) => {
      const solicitante = sufixoUnico('zz-solicitante');
      cy.api('POST', '/emprestimos', {
        patrimonio: unidade._id,
        solicitante_nome: solicitante,
        data_prevista_devolucao: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
      })
        .its('status')
        .should('eq', 201);

      // A API recusa data prevista no passado; o atraso vem do tempo passar.
      // Aqui a resposta é ajustada para conferir como a tela mostra o status.
      cy.intercept('GET', `${Cypress.env('API_URL')}/emprestimos*`, (req) => {
        req.continue((res) => {
          res.body?.data?.docs?.forEach(
            (doc: { solicitante_nome: string; status: string }) => {
              if (doc.solicitante_nome === solicitante) doc.status = 'Atrasado';
            },
          );
        });
      });

      cy.irPara('/emprestimos', 'emprestimos-page');
      cy.getByData('emprestimos-tab-unidade').click();
      cy.getByData('search-input').type(solicitante);
      cy.contains('tr', solicitante)
        .find('[data-test="status-badge"]')
        .should('contain.text', 'Atrasado');
    });
  });
});
