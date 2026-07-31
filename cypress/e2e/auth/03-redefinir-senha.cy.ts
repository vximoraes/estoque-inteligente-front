describe('Redefinir senha', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');

  beforeEach(() => {
    cy.clearCookies();
  });

  it('mostra "Link inválido" quando não há token na URL', () => {
    cy.visit(`${frontendUrl}/redefinir-senha`);
    cy.getByData('token-invalido').should('be.visible');
    cy.contains('Link inválido').should('be.visible');
  });

  it('"Solicitar novo link" leva pra esqueci-senha', () => {
    cy.visit(`${frontendUrl}/redefinir-senha`);
    cy.contains('Solicitar novo link').click();
    cy.url().should('include', '/esqueci-senha');
  });

  it('valida requisitos de senha em tempo real', () => {
    cy.visit(`${frontendUrl}/redefinir-senha?token=token-de-teste-e2e`);

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
    cy.visit(`${frontendUrl}/redefinir-senha?token=token-de-teste-e2e`);

    cy.getByData('senha-input').type('SenhaForte@123');
    cy.getByData('confirmar-senha-input').type('SenhaDiferente@123');
    cy.getByData('botao-redefinir-senha').click();

    cy.contains('As senhas não coincidem').should('be.visible');
  });

  it('mostra erro da API quando o token é inválido/expirado', () => {
    cy.visit(`${frontendUrl}/redefinir-senha?token=token-invalido-e2e`);

    cy.getByData('senha-input').type('SenhaForte@123');
    cy.getByData('confirmar-senha-input').type('SenhaForte@123');
    cy.getByData('botao-redefinir-senha').click();

    // Better Auth rejeita o token inválido; a página mostra o erro via toast
    // (react-toastify), sem navegar pra /login.
    cy.url({ timeout: 10000 }).should('include', '/redefinir-senha');
  });
});
