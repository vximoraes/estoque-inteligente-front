describe('Fornecedores - Listagem e Pesquisa', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let fornecedorTeste: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/sign-in/email`,
      headers: { Origin: frontendUrl },
      body: { email, password: senha },
    }).then((response) => {
      const token = response.body.token;
      fornecedorTeste = `Fornecedor Listagem ${Date.now()}`;

      cy.request({
        method: 'POST',
        url: `${apiUrl}/fornecedores`,
        headers: { Authorization: `Bearer ${token}` },
        body: { nome: fornecedorTeste },
      });
    });
  });

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/fornecedores*`).as('getFornecedores');
    cy.login(email, senha);
    cy.visit(`${frontendUrl}/fornecedores`);
    cy.wait('@getFornecedores', { timeout: 30000 });
  });

  describe('Listagem', () => {
    it('Deve exibir a página de fornecedores', () => {
      cy.getByData('fornecedores-page').should('be.visible');
    });

    it('Deve exibir a tabela de fornecedores com colunas corretas', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="fornecedores-table"]').length > 0) {
          cy.getByData('fornecedores-table').within(() => {
            cy.contains('th', 'NOME').should('be.visible');
            cy.contains('th', 'URL').should('be.visible');
            cy.contains('th', 'CONTATO').should('be.visible');
            cy.contains('th', 'DESCRIÇÃO').should('be.visible');
            cy.contains('th', 'AÇÕES').should('be.visible');
          });
        }
      });
    });
  });

  describe('Pesquisa', () => {
    it('Deve pesquisar fornecedor pelo nome', () => {
      cy.intercept('GET', `${apiUrl}/fornecedores*`).as('searchFornecedores');

      cy.getByData('search-input').type(fornecedorTeste);
      cy.wait('@searchFornecedores', { timeout: 30000 });
      cy.wait(500);

      cy.getByData('fornecedores-table').within(() => {
        cy.contains(fornecedorTeste).should('be.visible');
      });
    });

    it('Deve exibir estado vazio para pesquisa sem resultados', () => {
      cy.intercept('GET', `${apiUrl}/fornecedores*`).as('searchFornecedores');

      cy.getByData('search-input').type('Fornecedor Inexistente XYZ 999');
      cy.wait('@searchFornecedores', { timeout: 30000 });
      cy.wait(500);

      cy.getByData('empty-state').should('be.visible');
    });
  });

  describe('Visualização de Detalhes', () => {
    it('Deve abrir modal de detalhes ao clicar em uma linha', () => {
      cy.intercept('GET', `${apiUrl}/fornecedores*`).as('searchFornecedores');
      cy.getByData('search-input').type(fornecedorTeste);
      cy.wait('@searchFornecedores', { timeout: 30000 });
      cy.wait(500);

      cy.contains(fornecedorTeste).click();
      cy.getByData('modal-detalhes-fornecedor').should('be.visible');
      cy.getByData('modal-detalhes-fornecedor').should(
        'contain',
        fornecedorTeste,
      );
    });

    it('Deve fechar modal de detalhes ao clicar no X', () => {
      cy.intercept('GET', `${apiUrl}/fornecedores*`).as('searchFornecedores');
      cy.getByData('search-input').type(fornecedorTeste);
      cy.wait('@searchFornecedores', { timeout: 30000 });
      cy.wait(500);

      cy.contains(fornecedorTeste).click();
      cy.getByData('modal-detalhes-fornecedor').should('be.visible');
      cy.getByData('modal-detalhes-fornecedor-close').click();
      cy.getByData('modal-detalhes-fornecedor').should('not.exist');
    });
  });
});
