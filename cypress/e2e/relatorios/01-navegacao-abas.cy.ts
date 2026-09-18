describe('Relatórios - navegação entre abas', () => {
  beforeEach(() => {
    cy.login();
  });

  it('abre na aba de patrimônio por padrão', () => {
    cy.irPara('/relatorios', 'relatorios-page');
    cy.getByData('relatorio-patrimonio-page').should('be.visible');
  });

  it('navega para a aba de almoxarifado', () => {
    cy.irPara('/relatorios', 'relatorios-page');
    cy.getByData('relatorios-tab-almoxarifado').click();
    cy.getByData('relatorio-almoxarifado-page').should('be.visible');
  });

  it('navega para a aba de movimentações', () => {
    cy.irPara('/relatorios', 'relatorios-page');
    cy.getByData('relatorios-tab-movimentacoes').click();
    cy.getByData('relatorio-movimentacoes-page').should('be.visible');
  });

  it('navega para a aba de empréstimos', () => {
    cy.irPara('/relatorios', 'relatorios-page');
    cy.getByData('relatorios-tab-emprestimos').click();
    cy.getByData('relatorio-emprestimos-page').should('be.visible');
  });

  it('navega para a aba de tendência', () => {
    cy.irPara('/relatorios', 'relatorios-page');
    cy.getByData('relatorios-tab-tendencia').click();
    cy.getByData('relatorio-tendencia-page').should('be.visible');
  });

  it('mantém a aba selecionada via deep-link na URL', () => {
    cy.irPara('/relatorios?tab=emprestimos', 'relatorio-emprestimos-page');
  });
});
