describe('Resiliência e tela de celular', () => {
  beforeEach(() => {
    cy.login();
  });

  it('mostra erro na tela quando a API responde 500', () => {
    cy.intercept('GET', `${Cypress.env('API_URL')}/itens*`, {
      statusCode: 500,
      body: {
        error: true,
        code: 500,
        message: 'Erro interno do servidor.',
        errors: [],
      },
    });
    cy.visit('/bens/almoxarifado');
    cy.getByData('error-message', { timeout: 20000 }).should(
      'contain.text',
      'Erro ao carregar itens',
    );
  });

  describe('celular', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    [
      '/bens/patrimonio',
      '/bens/almoxarifado',
      '/emprestimos',
      '/relatorios',
    ].forEach((rota) => {
      it(`${rota} cabe na largura da tela`, () => {
        cy.visit(rota);
        cy.getByData('botao-menu-mobile').should('be.visible');
        cy.document().then((doc) => {
          expect(doc.documentElement.scrollWidth).to.be.at.most(
            doc.documentElement.clientWidth,
          );
        });
      });
    });

    it('abre o menu lateral pelo botão do cabeçalho', () => {
      cy.visit('/bens/patrimonio');
      cy.getByData('botao-menu-mobile').click();
      cy.getByData('sidebar-btn-sair-mobile')
        .scrollIntoView()
        .should('be.visible');
    });
  });
});

describe('Resiliência - login', () => {
  it('o login avisa quando o servidor está indisponível', () => {
    cy.clearCookies();
    cy.visit('/login?from=%2Fbens%2Fpatrimonio&indisponivel=1');
    cy.contains(
      'Não foi possível conectar ao servidor. Tente novamente em instantes.',
    ).should('be.visible');
  });
});
