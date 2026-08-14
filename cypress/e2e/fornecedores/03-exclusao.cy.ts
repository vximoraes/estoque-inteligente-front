describe('Fornecedores - Exclusão', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let authToken: string;
  let fornecedorNome: string;
  let fornecedorId: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/sign-in/email`,
      headers: { Origin: frontendUrl },
      body: { email, password: senha },
    }).then((response) => {
      authToken = response.body.token;
    });
  });

  beforeEach(() => {
    fornecedorNome = `Fornecedor Exclusao ${Date.now()}`;

    cy.request({
      method: 'POST',
      url: `${apiUrl}/fornecedores`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { nome: fornecedorNome },
    }).then((response) => {
      fornecedorId = response.body.data._id;
    });

    cy.intercept('GET', `${apiUrl}/fornecedores*`).as('getFornecedores');
    cy.intercept('PATCH', `${apiUrl}/fornecedores/*/inativar`).as(
      'deleteFornecedor',
    );

    cy.login(email, senha);
    cy.visit(`${frontendUrl}/fornecedores`);
    cy.wait('@getFornecedores', { timeout: 30000 });

    cy.intercept('GET', `${apiUrl}/fornecedores*`).as('searchFornecedores');
    cy.getByData('search-input').type(fornecedorNome);
    cy.wait('@searchFornecedores', { timeout: 30000 });
    cy.wait(500);
  });

  afterEach(() => {
    if (fornecedorId) {
      cy.request({
        method: 'PATCH',
        url: `${apiUrl}/fornecedores/${fornecedorId}/inativar`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
      });
    }
  });

  it('Deve abrir modal de confirmação ao clicar em Excluir', () => {
    cy.contains(fornecedorNome)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('delete-button').click();
      });

    cy.getByData('modal-excluir-fornecedor').should('be.visible');
    cy.getByData('modal-excluir-fornecedor').should('contain', fornecedorNome);
  });

  it('Deve fechar modal ao clicar em Cancelar', () => {
    cy.contains(fornecedorNome)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('delete-button').click();
      });

    cy.getByData('modal-excluir-fornecedor').should('be.visible');
    cy.getByData('modal-excluir-fornecedor-cancelar').click();
    cy.getByData('modal-excluir-fornecedor').should('not.exist');
  });

  it('Deve excluir fornecedor ao confirmar (soft delete via inativar)', () => {
    cy.contains(fornecedorNome)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('delete-button').click();
      });

    cy.getByData('modal-excluir-fornecedor').within(() => {
      cy.getByData('modal-excluir-fornecedor-confirmar').click();
    });

    cy.wait('@deleteFornecedor', { timeout: 30000 }).then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.request.url).to.include('/inativar');
    });

    cy.getByData('modal-excluir-fornecedor').should('not.exist');
    cy.contains('excluído com sucesso').should('be.visible');
    fornecedorId = '';
  });

  it('Fornecedor excluído não deve aparecer em nova busca', () => {
    cy.contains(fornecedorNome)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('delete-button').click();
      });

    cy.getByData('modal-excluir-fornecedor').within(() => {
      cy.getByData('modal-excluir-fornecedor-confirmar').click();
    });

    cy.wait('@deleteFornecedor', { timeout: 30000 });
    fornecedorId = '';

    cy.intercept('GET', `${apiUrl}/fornecedores*`).as('searchAfterDelete');
    cy.getByData('search-input').clear().type(fornecedorNome);
    cy.wait('@searchAfterDelete', { timeout: 30000 });
    cy.wait(500);

    cy.getByData('empty-state').should('be.visible');
  });
});
