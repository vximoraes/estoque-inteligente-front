describe('Perfil — Edição de Informações', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let nomeOriginal: string;
  let usuarioId: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/sign-in/email`,
      headers: { Origin: frontendUrl },
      body: { email, password: senha },
    }).then((loginResponse) => {
      const token = loginResponse.body.token;

      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/auth/get-session`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((sessionResponse) => {
        nomeOriginal = sessionResponse.body.user.name;
        usuarioId = sessionResponse.body.user.id;
      });
    });
  });

  after(() => {
    if (usuarioId && nomeOriginal) {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/api/auth/sign-in/email`,
        headers: { Origin: frontendUrl },
        body: { email, password: senha },
      }).then((loginResponse) => {
        const token = loginResponse.body.token;

        cy.request({
          method: 'PATCH',
          url: `${apiUrl}/usuarios/${usuarioId}`,
          headers: { Authorization: `Bearer ${token}` },
          body: { nome: nomeOriginal },
        });
      });
    }
  });

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/usuarios/*`).as('getUsuario');

    cy.login(email, senha);

    cy.visit(`${frontendUrl}/perfil`);

    cy.get('[data-test="loading-perfil-page"]', { timeout: 5000 }).should(
      'not.exist',
    );

    cy.get('[data-test="perfil-page"]', { timeout: 15000 }).should(
      'be.visible',
    );

    cy.wait('@getUsuario', { timeout: 15000 });
    cy.get('[data-test="edit-perfil-button"]').should('be.visible');
  });

  it('Abre o formulário de edição ao clicar em Editar perfil', () => {
    cy.get('[data-test="edit-perfil-button"]').click();

    cy.get('[data-test="form-editar-nome"]').should('be.visible');

    cy.get('[data-test="input-nome"]')
      .should('be.visible')
      .and(($input) => {
        expect($input.val()).to.not.be.empty;
      });
  });

  it('Fecha o formulário ao clicar em Cancelar', () => {
    cy.get('[data-test="edit-perfil-button"]').click();

    cy.get('[data-test="form-editar-nome"]').should('be.visible');

    cy.get('[data-test="cancel-edit-perfil-button"]').click();

    cy.get('[data-test="form-editar-nome"]').should('not.exist');
  });

  it('Edita o nome do usuário e salva', () => {
    const novoNome = 'Admin Teste ' + Date.now();

    cy.get('[data-test="edit-perfil-button"]').click();
    cy.get('[data-test="form-editar-nome"]').should('be.visible');

    cy.get('[data-test="input-nome"]').clear().type(novoNome);

    cy.get('[data-test="save-perfil-button"]').click();

    cy.get('[data-test="form-editar-nome"]').should('not.exist');

    cy.get('[data-test="perfil-nome"]', { timeout: 5000 }).should(
      'contain',
      novoNome,
    );
  });

  it('Desabilita o botão Salvar enquanto está salvando', () => {
    cy.get('[data-test="edit-perfil-button"]').click();

    cy.get('[data-test="input-nome"]').clear().type('Novo Nome Teste');

    cy.get('[data-test="save-perfil-button"]').click();

    cy.get('[data-test="save-perfil-button"]').should('be.disabled');
  });

  it('Cancela a edição e mantém o nome original', () => {
    cy.get('[data-test="perfil-nome"]')
      .invoke('text')
      .then((nomeOriginal) => {
        cy.get('[data-test="edit-perfil-button"]').click();

        cy.get('[data-test="input-nome"]').clear().type('Nome Temporário');

        cy.get('[data-test="cancel-edit-perfil-button"]').click();

        cy.get('[data-test="form-editar-nome"]').should('not.exist');

        cy.get('[data-test="perfil-nome"]').should('contain', nomeOriginal);
      });
  });
});
