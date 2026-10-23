import {
  criarCategoria,
  criarEmprestimo,
  criarItem,
  criarLocalizacao,
  criarMovimentacao,
  criarPatrimonio,
  sufixoUnico,
} from '../../support/helpers';

describe('Regras de negócio - mensagens de erro na tela', () => {
  beforeEach(() => {
    cy.login();
  });

  it('não deixa registrar saída maior que o estoque', () => {
    criarLocalizacao().then((localizacao) => {
      criarItem().then((item) => {
        criarMovimentacao({
          item: item._id,
          localizacao: localizacao._id,
          quantidade: '3',
        });
        cy.irPara('/bens/almoxarifado', 'almoxarifado-page');
        cy.getByData('search-input').type(item.nome);
        cy.contains(item.nome).should('be.visible');

        cy.getByData('saida-icon').first().should('not.be.disabled').click();
        cy.getByData('modal-saida-quantidade-input').type('10');
        cy.getByData('modal-saida-localizacao-dropdown').click();
        cy.contains(localizacao.nome).click();
        cy.getByData('modal-saida-confirmar').click();

        cy.contains('Quantidade maior que a disponível em estoque').should(
          'be.visible',
        );
        cy.getByData('modal-saida-content').should('be.visible');
      });
    });
  });

  it('não exclui categoria com item ativo', () => {
    criarCategoria().then((categoria) => {
      criarItem({ categoria: categoria._id });
      cy.irPara('/categorias', 'categorias-page');
      cy.getByData('categorias-tab-consumo').click();
      cy.getByData('search-input').type(categoria.nome);
      cy.contains(categoria.nome).should('be.visible');
      cy.getByData('delete-button').first().click();
      cy.getByData('modal-excluir-categoria-confirmar').click();
      cy.contains('Categoria vinculada a itens ativos.').should('be.visible');
    });
  });

  it('não exclui localização com patrimônio ativo', () => {
    criarLocalizacao().then((localizacao) => {
      criarPatrimonio({ localizacao: localizacao._id });
      cy.irPara('/localizacoes', 'localizacoes-page');
      cy.getByData('search-input').type(localizacao.nome);
      cy.contains(localizacao.nome).should('be.visible');
      cy.getByData('delete-button').first().click();
      cy.getByData('modal-excluir-localizacao-confirmar').click();
      cy.contains('Localização possui patrimônios ativos.').should(
        'be.visible',
      );
    });
  });

  it('não oferece remover patrimônio emprestado', () => {
    criarPatrimonio().then((unidade) => {
      cy.api('POST', '/emprestimos', {
        patrimonio: unidade._id,
        solicitante_nome: sufixoUnico('zz-solicitante'),
      })
        .its('status')
        .should('eq', 201);

      cy.irPara('/bens/patrimonio', 'patrimonio-page');
      cy.getByData('search-input').type(unidade.numero_patrimonio);
      cy.getByData('patrimonio-card-acoes-trigger').first().click();
      cy.getByData('patrimonio-acao-remover').should(
        'have.attr',
        'aria-disabled',
        'true',
      );
    });
  });

  it('não exclui empréstimo em aberto', () => {
    criarEmprestimo().then((emprestimo) => {
      cy.irPara('/emprestimos', 'emprestimos-page');
      cy.getByData('emprestimos-tab-quantidade').click();
      cy.getByData('search-input').type(emprestimo.solicitante_nome);
      cy.contains(emprestimo.solicitante_nome).should('be.visible');
      cy.getByData('excluir-button').first().click();
      cy.getByData('modal-excluir-emprestimo-confirmar').click();
      cy.contains(
        'Empréstimo em aberto; registre a devolução antes de excluir.',
      ).should('be.visible');
    });
  });
});
