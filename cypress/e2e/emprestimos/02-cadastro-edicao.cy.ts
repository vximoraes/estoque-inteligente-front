describe('Empréstimos - Cadastro e Edição', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let itemNome: string;
  let emprestimoIdCriado: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/sign-in/email`,
      headers: { Origin: frontendUrl },
      body: { email, password: senha },
    }).then((response) => {
      const token = response.body.token;
      const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      itemNome = `Item Emprestimo Cadastro ${unique}`;

      cy.request({
        method: 'POST',
        url: `${apiUrl}/categorias`,
        headers: { Authorization: `Bearer ${token}` },
        body: { nome: `Categoria Emprestimo Cadastro ${unique}` },
      }).then((categoriaResponse) => {
        const categoria = categoriaResponse.body.data._id;

        cy.request({
          method: 'POST',
          url: `${apiUrl}/localizacoes`,
          headers: { Authorization: `Bearer ${token}` },
          body: { nome: `Localizacao Emprestimo Cadastro ${unique}` },
        }).then((localizacaoResponse) => {
          const localizacao = localizacaoResponse.body.data._id;

          cy.request({
            method: 'POST',
            url: `${apiUrl}/itens`,
            headers: { Authorization: `Bearer ${token}` },
            body: {
              nome: itemNome,
              categoria,
              estoque_minimo: '5',
            },
          }).then((itemResponse) => {
            const item = itemResponse.body.data._id;

            cy.request({
              method: 'POST',
              url: `${apiUrl}/movimentacoes`,
              headers: { Authorization: `Bearer ${token}` },
              body: {
                tipo: 'entrada',
                quantidade: '50',
                item,
                localizacao,
              },
            });
          });
        });
      });
    });
  });

  after(() => {
    if (emprestimoIdCriado) {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/api/auth/sign-in/email`,
        headers: { Origin: frontendUrl },
        body: { email, password: senha },
      }).then((loginResponse) => {
        const token = loginResponse.body.token;
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/emprestimos/${emprestimoIdCriado}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        });
      });
    }
  });

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/emprestimos*`).as('getEmprestimos');
    cy.intercept('POST', `${apiUrl}/emprestimos`).as('createEmprestimo');
    cy.intercept('PUT', `${apiUrl}/emprestimos/*`).as('updateEmprestimo');

    cy.login(email, senha);
    cy.visit(`${frontendUrl}/emprestimos`);
    cy.wait('@getEmprestimos', { timeout: 30000 });
  });

  describe('Adicionar Empréstimo', () => {
    it('Deve abrir modal de cadastro ao clicar em Adicionar', () => {
      cy.getByData('adicionar-button').click();
      cy.getByData('modal-cadastrar-emprestimo').should('be.visible');
    });

    it('Deve fechar modal ao clicar no X', () => {
      cy.getByData('adicionar-button').click();
      cy.getByData('modal-cadastrar-emprestimo').should('be.visible');
      cy.getByData('modal-cadastrar-emprestimo-close').click();
      cy.getByData('modal-cadastrar-emprestimo').should('not.exist');
    });

    it('Deve validar solicitante obrigatório com no mínimo 3 caracteres', () => {
      cy.getByData('adicionar-button').click();
      cy.getByData('modal-cadastrar-emprestimo').should('be.visible');

      cy.getByData('modal-cadastrar-emprestimo-item-dropdown').click();
      cy.getByData('modal-cadastrar-emprestimo-item-pesquisa').type(itemNome);
      cy.wait(500);
      cy.getByData('modal-cadastrar-emprestimo-item-opcao').first().click();

      cy.getByData('modal-cadastrar-emprestimo-localizacao-dropdown').click();
      cy.getByData('modal-cadastrar-emprestimo-localizacao-opcao')
        .first()
        .click();

      cy.getByData('modal-cadastrar-emprestimo-quantidade').clear().type('1');
      cy.getByData('modal-cadastrar-emprestimo-solicitante').type('Jo');

      cy.getByData('modal-cadastrar-emprestimo-salvar').click();

      cy.getByData('modal-cadastrar-emprestimo').should('be.visible');
      cy.get('@createEmprestimo.all').should('have.length', 0);
    });

    it('Deve criar empréstimo com sucesso com dados válidos', () => {
      const solicitante = `Solicitante Cadastro ${Date.now()}`;

      cy.getByData('adicionar-button').click();
      cy.getByData('modal-cadastrar-emprestimo').should('be.visible');

      cy.getByData('modal-cadastrar-emprestimo-item-dropdown').click();
      cy.getByData('modal-cadastrar-emprestimo-item-pesquisa').type(itemNome);
      cy.wait(500);
      cy.getByData('modal-cadastrar-emprestimo-item-opcao').first().click();

      cy.getByData('modal-cadastrar-emprestimo-localizacao-dropdown').click();
      cy.getByData('modal-cadastrar-emprestimo-localizacao-opcao')
        .first()
        .click();

      cy.getByData('modal-cadastrar-emprestimo-quantidade').clear().type('2');
      cy.getByData('modal-cadastrar-emprestimo-solicitante').type(solicitante);

      cy.getByData('modal-cadastrar-emprestimo-salvar').click();

      cy.wait('@createEmprestimo', { timeout: 30000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);
        emprestimoIdCriado = interception.response?.body?.data?._id;
      });

      cy.getByData('modal-cadastrar-emprestimo').should('not.exist');
      cy.wait('@getEmprestimos', { timeout: 30000 });
      cy.contains(solicitante).should('be.visible');
    });
  });

  describe('Editar Empréstimo', () => {
    it('Deve editar solicitante e observações do empréstimo criado', () => {
      cy.get('body').then(() => {
        if (!emprestimoIdCriado) {
          cy.log('Empréstimo de teste não foi criado, pulando teste');
          return;
        }

        const novoSolicitante = `Solicitante Editado ${Date.now()}`;

        cy.contains(itemNome)
          .parents('tr')
          .first()
          .within(() => {
            cy.getByData('editar-button').click();
          });

        cy.getByData('modal-editar-emprestimo').should('be.visible');
        cy.getByData('modal-editar-emprestimo-solicitante')
          .clear()
          .type(novoSolicitante);
        cy.getByData('modal-editar-emprestimo-observacoes').type(
          'Observação de teste editada',
        );
        cy.getByData('modal-editar-emprestimo-salvar').click();

        cy.wait('@updateEmprestimo', { timeout: 30000 }).then(
          (interception) => {
            expect(interception.response?.statusCode).to.eq(200);
          },
        );

        cy.getByData('modal-editar-emprestimo').should('not.exist');
        cy.wait('@getEmprestimos', { timeout: 30000 });
        cy.contains(novoSolicitante).should('be.visible');
      });
    });
  });
});
