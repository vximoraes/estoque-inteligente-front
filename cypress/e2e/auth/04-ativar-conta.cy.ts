describe('Ativar conta', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');

  beforeEach(() => {
    cy.clearCookies();
  });

  it('mostra "Link inválido" quando não há token na URL', () => {
    cy.visit(`${frontendUrl}/ativar-conta`);
    cy.getByData('token-invalido').should('be.visible');
    cy.contains('Link inválido').should('be.visible');
  });

  it('"Ir para acesso" leva pro login', () => {
    cy.visit(`${frontendUrl}/ativar-conta`);
    cy.contains('Ir para acesso').click();
    cy.url().should('include', '/login');
  });

  it('valida requisitos de senha em tempo real', () => {
    cy.visit(`${frontendUrl}/ativar-conta?token=token-de-teste-e2e`);

    cy.getByData('senha-input').type('fraca');
    cy.contains('Mínimo de 8 caracteres').should(
      'have.class',
      'text-muted-foreground',
    );

    cy.getByData('senha-input').clear().type('SenhaForte@123');
    cy.contains('Mínimo de 8 caracteres').should(
      'have.class',
      'text-emerald-600',
    );
    cy.contains('Uma letra maiúscula').should('have.class', 'text-emerald-600');
    cy.contains('Um número').should('have.class', 'text-emerald-600');
  });

  it('bloqueia envio quando as senhas não coincidem', () => {
    cy.visit(`${frontendUrl}/ativar-conta?token=token-de-teste-e2e`);

    cy.getByData('senha-input').type('SenhaForte@123');
    cy.getByData('confirmar-senha-input').type('SenhaDiferente@123');
    cy.getByData('botao-ativar-conta').click();

    cy.contains('As senhas não coincidem').should('be.visible');
  });

  it('mostra erro da API quando o token é inválido/expirado', () => {
    cy.visit(`${frontendUrl}/ativar-conta?token=token-invalido-e2e`);

    cy.getByData('senha-input').type('SenhaForte@123');
    cy.getByData('confirmar-senha-input').type('SenhaForte@123');
    cy.getByData('botao-ativar-conta').click();

    cy.url({ timeout: 10000 }).should('include', '/ativar-conta');
  });

  it('exibe botão de continuar com Google', () => {
    cy.visit(`${frontendUrl}/ativar-conta?token=token-de-teste-e2e`);
    cy.getByData('botao-google').should('be.visible').and('not.be.disabled');
  });

  it('link "Acessar sistema" leva pro login', () => {
    cy.visit(`${frontendUrl}/ativar-conta?token=token-de-teste-e2e`);
    cy.contains('Acessar sistema').click();
    cy.url().should('include', '/login');
  });
});
