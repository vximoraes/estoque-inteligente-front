import {
  criarCategoria,
  criarLocalizacao,
  criarPatrimonio,
  sufixoUnico,
} from '../../support/helpers';

describe('Patrimônio - cadastro e edição', () => {
  beforeEach(() => {
    cy.login();
  });

  it('cadastra uma unidade de patrimônio válida', () => {
    criarCategoria({ tipo: 'permanente' }).then((categoria) => {
      criarLocalizacao().then((localizacao) => {
        const numero = sufixoUnico('zz-patrimonio');

        cy.irPara('/bens/patrimonio', 'patrimonio-page');
        cy.getByData('adicionar-button').click();
        cy.getByData('modal-cadastrar-patrimonio').should('be.visible');

        cy.getByData('numero-patrimonio-input').clear().type(numero);
        cy.getByData('modelo-input').type('Modelo de teste');

        cy.getByData('botao-selecionar-categoria').click();
        cy.getByData('input-pesquisa-categoria').type(categoria.nome);
        cy.get('[data-test="categoria-option"]')
          .contains(categoria.nome)
          .click();

        cy.getByData('botao-selecionar-localizacao').click();
        cy.getByData('input-pesquisa-localizacao').type(localizacao.nome);
        cy.get('[data-test="localizacao-option"]')
          .contains(localizacao.nome)
          .click();

        cy.getByData('modal-cadastrar-patrimonio-confirmar').click();
        cy.getByData('modal-cadastrar-patrimonio').should('not.exist');
        // Listagem é paginada e ordenada por numero_patrimonio — o prefixo
        // zz- cai fora da primeira página; busca para encontrar o criado.
        cy.getByData('search-input').type(numero);
        // numero_patrimonio é salvo em maiúsculas (Model uppercase:true).
        cy.contains(numero.toUpperCase()).should('be.visible');
      });
    });
  });

  it('exibe erro ao tentar cadastrar sem número de patrimônio', () => {
    cy.irPara('/bens/patrimonio', 'patrimonio-page');
    cy.getByData('adicionar-button').click();
    cy.getByData('modal-cadastrar-patrimonio-confirmar').click();
    cy.getByData('modal-cadastrar-patrimonio').should('be.visible');
    cy.contains('obrigatório').should('be.visible');
  });

  it('edita o modelo de uma unidade existente', () => {
    criarPatrimonio().then((patrimonio) => {
      cy.irPara('/bens/patrimonio', 'patrimonio-page');
      cy.getByData('search-input').type(patrimonio.numero_patrimonio);
      cy.contains(patrimonio.numero_patrimonio).should('be.visible');
      cy.getByData('patrimonio-card-acoes-trigger').first().click();
      cy.getByData('patrimonio-acao-editar').should('be.visible').click();

      cy.getByData('modal-editar-patrimonio').should('be.visible');
      const novoModelo = sufixoUnico('zz-modelo');
      cy.getByData('modelo-input').clear().type(novoModelo);
      cy.getByData('modal-editar-patrimonio-confirmar').click();

      cy.getByData('modal-editar-patrimonio').should('not.exist');
      cy.contains(novoModelo).should('be.visible');
    });
  });

  it('remove uma unidade cadastrada por engano', () => {
    criarPatrimonio().then((patrimonio) => {
      cy.irPara('/bens/patrimonio', 'patrimonio-page');
      cy.getByData('search-input').type(patrimonio.numero_patrimonio);
      cy.getByData('patrimonio-card-acoes-trigger').first().click();
      cy.getByData('patrimonio-acao-remover').click();

      cy.getByData('modal-patrimonio-remover').should('be.visible');
      cy.getByData('modal-patrimonio-remover-confirmar').click();
      cy.getByData('modal-patrimonio-remover').should('not.exist');
      cy.contains(patrimonio.numero_patrimonio).should('not.exist');
    });
  });
});
