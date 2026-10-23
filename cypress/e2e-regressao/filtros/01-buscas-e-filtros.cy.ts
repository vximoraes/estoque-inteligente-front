import {
  criarCategoria,
  criarEmprestimo,
  criarFornecedor,
  criarItem,
  criarLocalizacao,
} from '../../support/helpers';

describe('Buscas e filtros', () => {
  beforeEach(() => {
    cy.login();
  });

  it('busca de fornecedores mostra só o que casa com o nome', () => {
    criarFornecedor().then((procurado) => {
      criarFornecedor().then((outro) => {
        cy.irPara('/fornecedores', 'fornecedores-page');
        cy.getByData('search-input').type(procurado.nome);
        cy.contains(procurado.nome).should('be.visible');
        cy.contains(outro.nome).should('not.exist');
      });
    });
  });

  it('busca de localizações mostra só o que casa com o nome', () => {
    criarLocalizacao().then((procurada) => {
      criarLocalizacao().then((outra) => {
        cy.irPara('/localizacoes', 'localizacoes-page');
        cy.getByData('search-input').type(procurada.nome);
        cy.contains(procurada.nome).should('be.visible');
        cy.contains(outra.nome).should('not.exist');
      });
    });
  });

  it('filtra o almoxarifado por categoria e por status', () => {
    criarCategoria({ tipo: 'consumo' }).then((categoria) => {
      criarItem({ categoria: categoria._id }).then((item) => {
        cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
        cy.getByData('filtros-button').click();
        cy.getByData('filtro-categoria-dropdown').click();
        cy.getByData('filtro-categoria-search-input').type(categoria.nome);
        cy.getByData(`filtro-categoria-option-${categoria._id}`).click();
        cy.getByData('filtro-status-dropdown').click();
        cy.getByData('filtro-status-option-indisponível').click();
        cy.getByData('aplicar-filtros-button').click();

        cy.getByData('applied-filter-categoria-nome').should(
          'contain.text',
          categoria.nome,
        );
        cy.getByData('applied-filter-status-nome').should(
          'contain.text',
          'Indisponível',
        );
        cy.contains(item.nome).should('be.visible');
      });
    });
  });

  it('filtra empréstimos por status', () => {
    criarEmprestimo().then((emprestimo) => {
      cy.irPara('/emprestimos', 'emprestimos-page');
      cy.getByData('emprestimos-tab-quantidade').click();
      cy.getByData('search-input').type(emprestimo.solicitante_nome);
      cy.contains(emprestimo.solicitante_nome).should('be.visible');

      cy.getByData('status-filter-select').click();
      cy.get('[role="option"]').contains('Devolvido').click();
      cy.contains(emprestimo.solicitante_nome).should('not.exist');

      cy.getByData('status-filter-select').click();
      cy.get('[role="option"]').contains('Ativo').click();
      cy.contains(emprestimo.solicitante_nome).should('be.visible');
    });
  });
});
