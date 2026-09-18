import { criarLocalizacao, sufixoUnico } from '../../support/helpers';

describe('Localizações - cadastro, edição e exclusão', () => {
  beforeEach(() => {
    cy.login();
  });

  it('cadastra uma localização válida', () => {
    const nome = sufixoUnico('zz-localizacao');
    cy.irPara('/localizacoes', 'localizacoes-page');
    cy.getByData('adicionar-button').click();
    cy.getByData('modal-cadastrar-localizacao').should('be.visible');

    cy.getByData('nome-input').type(nome);
    cy.getByData('modal-cadastrar-localizacao-confirmar').click();
    cy.getByData('modal-cadastrar-localizacao').should('not.exist');

    cy.getByData('search-input').type(nome);
    cy.contains(nome).should('be.visible');
  });

  it('exibe erro ao tentar cadastrar sem nome', () => {
    cy.irPara('/localizacoes', 'localizacoes-page');
    cy.getByData('adicionar-button').click();
    cy.getByData('modal-cadastrar-localizacao-confirmar').click();
    cy.getByData('modal-cadastrar-localizacao').should('be.visible');
  });

  it('edita o nome de uma localização existente', () => {
    criarLocalizacao().then((localizacao) => {
      cy.irPara('/localizacoes', 'localizacoes-page');
      cy.getByData('search-input').type(localizacao.nome);
      cy.contains(localizacao.nome).should('be.visible');
      cy.getByData('edit-button').first().click();

      cy.getByData('modal-editar-localizacao').should('be.visible');
      const novoNome = sufixoUnico('zz-localizacao-editada');
      cy.getByData('nome-input').clear().type(novoNome);
      cy.getByData('modal-editar-localizacao-confirmar').click();
      cy.getByData('modal-editar-localizacao').should('not.exist');

      // A busca ainda filtra pelo nome antigo — atualizar o filtro.
      cy.getByData('search-input').clear();
      cy.getByData('search-input').should('have.value', '');
      cy.getByData('search-input').type(novoNome);
      cy.contains(novoNome).should('be.visible');
    });
  });

  it('exclui uma localização existente', () => {
    criarLocalizacao().then((localizacao) => {
      cy.irPara('/localizacoes', 'localizacoes-page');
      cy.getByData('search-input').type(localizacao.nome);
      cy.contains(localizacao.nome).should('be.visible');
      cy.getByData('delete-button').first().click();

      cy.getByData('modal-excluir-localizacao').should('be.visible');
      cy.getByData('modal-excluir-localizacao-confirmar').click();
      cy.getByData('modal-excluir-localizacao').should('not.exist');

      cy.contains(localizacao.nome).should('not.exist');
    });
  });
});
