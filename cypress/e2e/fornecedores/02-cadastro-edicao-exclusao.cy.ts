import { criarFornecedor, sufixoUnico } from '../../support/helpers';

describe('Fornecedores - cadastro, edição e exclusão', () => {
  beforeEach(() => {
    cy.login();
  });

  it('cadastra um fornecedor válido', () => {
    const nome = sufixoUnico('zz-fornecedor');
    cy.irPara('/fornecedores', 'fornecedores-page');
    cy.getByData('adicionar-button').click();
    cy.getByData('modal-cadastrar-fornecedor').should('be.visible');

    cy.getByData('nome-input').type(nome);
    cy.getByData('modal-cadastrar-fornecedor-confirmar').click();
    cy.getByData('modal-cadastrar-fornecedor').should('not.exist');

    cy.getByData('search-input').type(nome);
    cy.contains(nome).should('be.visible');
  });

  it('exibe erro ao tentar cadastrar sem nome', () => {
    cy.irPara('/fornecedores', 'fornecedores-page');
    cy.getByData('adicionar-button').click();
    cy.getByData('modal-cadastrar-fornecedor-confirmar').click();
    cy.getByData('modal-cadastrar-fornecedor').should('be.visible');
  });

  it('edita o nome de um fornecedor existente', () => {
    criarFornecedor().then((fornecedor) => {
      cy.irPara('/fornecedores', 'fornecedores-page');
      cy.getByData('search-input').type(fornecedor.nome);
      cy.contains(fornecedor.nome).should('be.visible');
      cy.getByData('edit-button').first().click();

      cy.getByData('modal-editar-fornecedor').should('be.visible');
      const novoNome = sufixoUnico('zz-fornecedor-editado');
      cy.getByData('nome-input').clear().type(novoNome);
      cy.getByData('modal-editar-fornecedor-confirmar').click();
      cy.getByData('modal-editar-fornecedor').should('not.exist');

      cy.getByData('search-input').clear();
      cy.getByData('search-input').should('have.value', '');
      cy.getByData('search-input').type(novoNome);
      cy.contains(novoNome).should('be.visible');
    });
  });

  it('exclui um fornecedor existente', () => {
    criarFornecedor().then((fornecedor) => {
      cy.irPara('/fornecedores', 'fornecedores-page');
      cy.getByData('search-input').type(fornecedor.nome);
      cy.contains(fornecedor.nome).should('be.visible');
      cy.getByData('delete-button').first().click();

      cy.getByData('modal-excluir-fornecedor').should('be.visible');
      cy.getByData('modal-excluir-fornecedor-confirmar').click();
      cy.getByData('modal-excluir-fornecedor').should('not.exist');

      cy.contains(fornecedor.nome).should('not.exist');
    });
  });
});
