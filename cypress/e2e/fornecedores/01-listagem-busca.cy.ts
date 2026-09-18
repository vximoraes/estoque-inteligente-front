import { criarFornecedor } from '../../support/helpers';

describe('Fornecedores - listagem e busca', () => {
  beforeEach(() => {
    cy.login();
  });

  it('lista fornecedores cadastrados', () => {
    criarFornecedor().then((fornecedor) => {
      cy.irPara('/fornecedores', 'fornecedores-page');
      cy.getByData('search-input').type(fornecedor.nome);
      cy.contains(fornecedor.nome).should('be.visible');
    });
  });
});
