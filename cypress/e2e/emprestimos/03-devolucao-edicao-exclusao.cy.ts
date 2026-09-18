import { criarEmprestimo, sufixoUnico } from '../../support/helpers';

describe('Empréstimos - devolução, edição e exclusão', () => {
  beforeEach(() => {
    cy.login();
  });

  it('registra devolução parcial de um empréstimo', () => {
    criarEmprestimo({ quantidade_emprestada: 4 }).then((emprestimo) => {
      cy.irPara('/emprestimos', 'emprestimos-page');
      cy.getByData('emprestimos-tab-quantidade').click();
      cy.getByData('search-input').type(emprestimo.solicitante_nome);
      cy.contains(emprestimo.solicitante_nome).should('be.visible');

      cy.getByData('devolver-button').first().click();
      cy.getByData('modal-devolver-item').should('be.visible');
      cy.getByData('modal-devolver-item-quantidade').clear().type('2');
      cy.getByData('modal-devolver-item-confirmar').click();
      cy.getByData('modal-devolver-item').should('not.exist');
    });
  });

  it('edita as observações de um empréstimo existente', () => {
    criarEmprestimo().then((emprestimo) => {
      cy.irPara('/emprestimos', 'emprestimos-page');
      cy.getByData('emprestimos-tab-quantidade').click();
      cy.getByData('search-input').type(emprestimo.solicitante_nome);
      cy.contains(emprestimo.solicitante_nome).should('be.visible');

      cy.getByData('editar-button').first().click();
      cy.getByData('modal-editar-emprestimo').should('be.visible');
      const novoSolicitante = sufixoUnico('zz-solicitante-editado');
      cy.getByData('modal-editar-emprestimo-solicitante')
        .clear()
        .type(novoSolicitante);
      cy.getByData('modal-editar-emprestimo-salvar').click();
      cy.getByData('modal-editar-emprestimo').should('not.exist');

      cy.getByData('search-input').clear();
      cy.getByData('search-input').should('have.value', '');
      cy.getByData('search-input').type(novoSolicitante);
      cy.contains(novoSolicitante).should('be.visible');
    });
  });

  it('exclui um empréstimo já devolvido', () => {
    criarEmprestimo({ quantidade_emprestada: 3 }).then((emprestimo) => {
      cy.irPara('/emprestimos', 'emprestimos-page');
      cy.getByData('emprestimos-tab-quantidade').click();
      cy.getByData('search-input').type(emprestimo.solicitante_nome);
      cy.contains(emprestimo.solicitante_nome).should('be.visible');

      cy.getByData('devolver-button').first().click();
      cy.getByData('modal-devolver-item-quantidade').clear().type('3');
      cy.getByData('modal-devolver-item-confirmar').click();
      cy.getByData('modal-devolver-item').should('not.exist');

      cy.getByData('excluir-button').first().click();
      cy.getByData('modal-excluir-emprestimo').should('be.visible');
      cy.getByData('modal-excluir-emprestimo-confirmar').click();
      cy.getByData('modal-excluir-emprestimo').should('not.exist');

      cy.contains(emprestimo.solicitante_nome).should('not.exist');
    });
  });
});
