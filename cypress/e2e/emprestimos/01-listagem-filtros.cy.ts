import { criarEmprestimo } from '../../support/helpers';

describe('Empréstimos - listagem e filtros', () => {
  beforeEach(() => {
    cy.login();
  });

  it('lista empréstimos por quantidade cadastrados', () => {
    criarEmprestimo().then((emprestimo) => {
      cy.irPara('/emprestimos', 'emprestimos-page');
      cy.getByData('emprestimos-tab-quantidade').click();
      cy.getByData('search-input').type(emprestimo.solicitante_nome);
      cy.contains(emprestimo.solicitante_nome).should('be.visible');
    });
  });
});
