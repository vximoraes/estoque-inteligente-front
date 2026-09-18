import { criarMovimentacao, sufixoUnico } from '../../support/helpers';

describe('Empréstimos - cadastro', () => {
  beforeEach(() => {
    cy.login();
  });

  it('cadastra um empréstimo por quantidade válido', () => {
    criarMovimentacao().then((movimentacao) => {
      cy.irPara('/emprestimos', 'emprestimos-page');
      cy.getByData('emprestimos-tab-quantidade').click();
      cy.getByData('adicionar-button').click();
      cy.getByData('modal-cadastrar-emprestimo').should('be.visible');

      cy.getByData('modal-cadastrar-emprestimo-item-dropdown').click();
      cy.getByData('modal-cadastrar-emprestimo-item-pesquisa').type(
        movimentacao.item.nome,
      );
      cy.get('[data-test="modal-cadastrar-emprestimo-item-opcao"]')
        .contains(movimentacao.item.nome)
        .click();

      cy.getByData('modal-cadastrar-emprestimo-localizacao-dropdown').click();
      cy.get('[data-test="modal-cadastrar-emprestimo-localizacao-opcao"]')
        .contains(movimentacao.localizacao.nome)
        .click();

      cy.getByData('modal-cadastrar-emprestimo-quantidade').type('5');
      const solicitante = sufixoUnico('zz-solicitante');
      cy.getByData('modal-cadastrar-emprestimo-solicitante').type(solicitante);

      cy.getByData('modal-cadastrar-emprestimo-salvar').click();
      cy.getByData('modal-cadastrar-emprestimo').should('not.exist');

      cy.getByData('search-input').type(solicitante);
      cy.contains(solicitante).should('be.visible');
    });
  });
});
