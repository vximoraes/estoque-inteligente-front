describe('Empréstimos - Exclusão', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let authToken: string;
  let item: string;
  let localizacao: string;
  let solicitanteTeste: string;
  let emprestimoTesteId: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/sign-in/email`,
      headers: { Origin: frontendUrl },
      body: { email, password: senha },
    }).then((response) => {
      authToken = response.body.token;
      const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      cy.request({
        method: 'POST',
        url: `${apiUrl}/categorias`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { nome: `Categoria Emprestimo Exclusao ${unique}` },
      }).then((categoriaResponse) => {
        const categoria = categoriaResponse.body.data._id;

        cy.request({
          method: 'POST',
          url: `${apiUrl}/localizacoes`,
          headers: { Authorization: `Bearer ${authToken}` },
          body: { nome: `Localizacao Emprestimo Exclusao ${unique}` },
        }).then((localizacaoResponse) => {
          localizacao = localizacaoResponse.body.data._id;

          cy.request({
            method: 'POST',
            url: `${apiUrl}/itens`,
            headers: { Authorization: `Bearer ${authToken}` },
            body: {
              nome: `Item Emprestimo Exclusao ${unique}`,
              categoria,
              estoque_minimo: '5',
            },
          }).then((itemResponse) => {
            item = itemResponse.body.data._id;

            cy.request({
              method: 'POST',
              url: `${apiUrl}/movimentacoes`,
              headers: { Authorization: `Bearer ${authToken}` },
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

  beforeEach(() => {
    solicitanteTeste = `Solicitante Exclusao ${Date.now()}`;

    cy.request({
      method: 'POST',
      url: `${apiUrl}/emprestimos`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        item,
        localizacao,
        quantidade_emprestada: 1,
        solicitante_nome: solicitanteTeste,
      },
    }).then((emprestimoResponse) => {
      emprestimoTesteId = emprestimoResponse.body.data._id;
    });

    cy.intercept('GET', `${apiUrl}/emprestimos*`).as('getEmprestimos');
    cy.intercept('DELETE', `${apiUrl}/emprestimos/*`).as('deleteEmprestimo');

    cy.login(email, senha);
    cy.visit(`${frontendUrl}/emprestimos`);
    cy.wait('@getEmprestimos', { timeout: 30000 });
  });

  afterEach(() => {
    if (emprestimoTesteId) {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/emprestimos/${emprestimoTesteId}`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
      });
    }
  });

  it('Deve abrir modal de confirmação ao clicar em Excluir', () => {
    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('excluir-button').click();
      });

    cy.getByData('modal-excluir-emprestimo').should('be.visible');
  });

  it('Deve fechar modal ao clicar em Cancelar', () => {
    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('excluir-button').click();
      });

    cy.getByData('modal-excluir-emprestimo').should('be.visible');
    cy.getByData('modal-excluir-emprestimo-cancelar').click();
    cy.getByData('modal-excluir-emprestimo').should('not.exist');
  });

  it('Deve excluir empréstimo ao confirmar', () => {
    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('excluir-button').click();
      });

    cy.getByData('modal-excluir-emprestimo').within(() => {
      cy.getByData('modal-excluir-emprestimo-confirmar').click();
    });

    cy.wait('@deleteEmprestimo', { timeout: 30000 }).then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
    });

    cy.getByData('modal-excluir-emprestimo').should('not.exist');
    emprestimoTesteId = '';
  });

  it('Empréstimo excluído não deve aparecer em nova busca', () => {
    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('excluir-button').click();
      });

    cy.getByData('modal-excluir-emprestimo').within(() => {
      cy.getByData('modal-excluir-emprestimo-confirmar').click();
    });

    cy.wait('@deleteEmprestimo', { timeout: 30000 });
    emprestimoTesteId = '';

    cy.intercept('GET', `${apiUrl}/emprestimos*`).as('searchAfterDelete');
    cy.getByData('search-input').type(solicitanteTeste);
    cy.wait('@searchAfterDelete', { timeout: 30000 });
    cy.wait(500);

    cy.getByData('empty-state').should('be.visible');
  });
});
