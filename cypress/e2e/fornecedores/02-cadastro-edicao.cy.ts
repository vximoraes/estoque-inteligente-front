describe('Fornecedores - Cadastro e Edição', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let fornecedorNomeExistente: string;
  let fornecedorIdCriado: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/sign-in/email`,
      headers: { Origin: frontendUrl },
      body: { email, password: senha },
    }).then((response) => {
      const token = response.body.token;
      fornecedorNomeExistente = `Fornecedor Duplicado ${Date.now()}`;

      cy.request({
        method: 'POST',
        url: `${apiUrl}/fornecedores`,
        headers: { Authorization: `Bearer ${token}` },
        body: { nome: fornecedorNomeExistente },
      });
    });
  });

  after(() => {
    if (fornecedorIdCriado) {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/api/auth/sign-in/email`,
        headers: { Origin: frontendUrl },
        body: { email, password: senha },
      }).then((loginResponse) => {
        const token = loginResponse.body.token;
        cy.request({
          method: 'PATCH',
          url: `${apiUrl}/fornecedores/${fornecedorIdCriado}/inativar`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        });
      });
    }
  });

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/fornecedores*`).as('getFornecedores');
    cy.intercept('POST', `${apiUrl}/fornecedores`).as('createFornecedor');
    cy.intercept('PATCH', `${apiUrl}/fornecedores/*`).as('updateFornecedor');

    cy.login(email, senha);
    cy.visit(`${frontendUrl}/fornecedores`);
    cy.wait('@getFornecedores', { timeout: 30000 });
  });

  describe('Adicionar Fornecedor', () => {
    it('Deve abrir modal de cadastro ao clicar em Adicionar', () => {
      cy.getByData('adicionar-button').click();
      cy.getByData('modal-cadastrar-fornecedor').should('be.visible');
    });

    it('Deve fechar modal ao clicar no X', () => {
      cy.getByData('adicionar-button').click();
      cy.getByData('modal-cadastrar-fornecedor').should('be.visible');
      cy.getByData('modal-cadastrar-fornecedor-close').click();
      cy.getByData('modal-cadastrar-fornecedor').should('not.exist');
    });

    it('Deve validar nome obrigatório', () => {
      cy.getByData('adicionar-button').click();
      cy.getByData('modal-cadastrar-fornecedor-confirmar').click();
      cy.getByData('modal-cadastrar-fornecedor').should('be.visible');
      cy.get('@createFornecedor.all').should('have.length', 0);
    });

    it('Não deve permitir nome duplicado', () => {
      cy.getByData('adicionar-button').click();
      cy.getByData('nome-input').type(fornecedorNomeExistente);
      cy.getByData('modal-cadastrar-fornecedor-confirmar').click();

      cy.wait('@createFornecedor', { timeout: 30000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(400);
      });

      cy.getByData('modal-cadastrar-fornecedor').should('be.visible');
    });

    it('Deve criar fornecedor com sucesso com dados válidos', () => {
      const nome = `Fornecedor Cadastro ${Date.now()}`;

      cy.getByData('adicionar-button').click();
      cy.getByData('nome-input').type(nome);
      cy.getByData('url-input').type('https://exemplo.com.br');
      cy.getByData('contato-input').type('(11) 99999-0000');
      cy.getByData('descricao-input').type('Fornecedor criado via teste E2E');

      cy.getByData('modal-cadastrar-fornecedor-confirmar').click();

      cy.wait('@createFornecedor', { timeout: 30000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);
        fornecedorIdCriado = interception.response?.body?.data?._id;
      });

      cy.getByData('modal-cadastrar-fornecedor').should('not.exist');
      cy.wait('@getFornecedores', { timeout: 30000 });
      cy.contains(nome).should('be.visible');
    });
  });

  describe('Editar Fornecedor', () => {
    it('Deve pré-preencher os campos com os dados atuais', () => {
      cy.get('body').then(() => {
        if (!fornecedorIdCriado) {
          cy.log('Fornecedor de teste não foi criado, pulando teste');
          return;
        }

        cy.intercept('GET', `${apiUrl}/fornecedores*`).as('searchFornecedores');
        cy.getByData('search-input').type('Fornecedor Cadastro');
        cy.wait('@searchFornecedores', { timeout: 30000 });
        cy.wait(500);

        cy.getByData('fornecedores-table')
          .find('tbody tr')
          .first()
          .within(() => {
            cy.getByData('edit-button').click();
          });

        cy.getByData('modal-editar-fornecedor').should('be.visible');
        cy.getByData('nome-input').should(($input) => {
          expect(($input.val() as string).length).to.be.greaterThan(0);
        });
      });
    });

    it('Deve atualizar fornecedor com sucesso', () => {
      cy.get('body').then(() => {
        if (!fornecedorIdCriado) {
          cy.log('Fornecedor de teste não foi criado, pulando teste');
          return;
        }

        const novaDescricao = `Descrição editada ${Date.now()}`;

        cy.intercept('GET', `${apiUrl}/fornecedores*`).as('searchFornecedores');
        cy.getByData('search-input').type('Fornecedor Cadastro');
        cy.wait('@searchFornecedores', { timeout: 30000 });
        cy.wait(500);

        cy.getByData('fornecedores-table')
          .find('tbody tr')
          .first()
          .within(() => {
            cy.getByData('edit-button').click();
          });

        cy.getByData('modal-editar-fornecedor').should('be.visible');
        cy.getByData('descricao-input').clear().type(novaDescricao);
        cy.getByData('modal-editar-fornecedor-confirmar').click();

        cy.wait('@updateFornecedor', { timeout: 30000 }).then(
          (interception) => {
            expect(interception.response?.statusCode).to.eq(200);
          },
        );

        cy.getByData('modal-editar-fornecedor').should('not.exist');
      });
    });
  });
});
