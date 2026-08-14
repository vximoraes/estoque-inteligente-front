describe('Empréstimos - Listagem, Pesquisa e Filtros', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let solicitanteTeste: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/sign-in/email`,
      headers: { Origin: frontendUrl },
      body: { email, password: senha },
    }).then((response) => {
      const token = response.body.token;
      const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      solicitanteTeste = `Solicitante Listagem ${unique}`;

      cy.request({
        method: 'POST',
        url: `${apiUrl}/categorias`,
        headers: { Authorization: `Bearer ${token}` },
        body: { nome: `Categoria Emprestimo ${unique}` },
      }).then((categoriaResponse) => {
        const categoria = categoriaResponse.body.data._id;

        cy.request({
          method: 'POST',
          url: `${apiUrl}/localizacoes`,
          headers: { Authorization: `Bearer ${token}` },
          body: { nome: `Localizacao Emprestimo ${unique}` },
        }).then((localizacaoResponse) => {
          const localizacao = localizacaoResponse.body.data._id;

          cy.request({
            method: 'POST',
            url: `${apiUrl}/itens`,
            headers: { Authorization: `Bearer ${token}` },
            body: {
              nome: `Item Emprestimo ${unique}`,
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
            }).then(() => {
              cy.request({
                method: 'POST',
                url: `${apiUrl}/emprestimos`,
                headers: { Authorization: `Bearer ${token}` },
                body: {
                  item,
                  localizacao,
                  quantidade_emprestada: 3,
                  solicitante_nome: solicitanteTeste,
                },
              });
            });
          });
        });
      });
    });
  });

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/emprestimos*`).as('getEmprestimos');
    cy.login(email, senha);
    cy.visit(`${frontendUrl}/emprestimos`);
    cy.wait('@getEmprestimos', { timeout: 30000 });
  });

  describe('Listagem', () => {
    it('Deve exibir a tabela de empréstimos', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="emprestimos-table"]').length > 0) {
          cy.getByData('emprestimos-table').should('be.visible');
        } else {
          cy.getByData('empty-state').should('be.visible');
        }
      });
    });

    it('Deve exibir colunas corretas na tabela', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="emprestimos-table"]').length > 0) {
          cy.getByData('emprestimos-table').within(() => {
            cy.contains('th', 'ITEM').should('be.visible');
            cy.contains('th', 'SOLICITANTE').should('be.visible');
            cy.contains('th', 'QTD. EMPRESTADA').should('be.visible');
            cy.contains('th', 'DATA PREVISTA').should('be.visible');
            cy.contains('th', 'STATUS').should('be.visible');
            cy.contains('th', 'AÇÕES').should('be.visible');
            cy.contains('th', 'DEVOLVER').should('be.visible');
          });
        }
      });
    });
  });

  describe('Pesquisa', () => {
    it('Deve pesquisar empréstimo pelo nome do solicitante', () => {
      cy.intercept('GET', `${apiUrl}/emprestimos*`).as('searchEmprestimos');

      cy.getByData('search-input').type(solicitanteTeste);
      cy.wait('@searchEmprestimos', { timeout: 30000 });
      cy.wait(500);

      cy.getByData('emprestimos-table').within(() => {
        cy.contains(solicitanteTeste).should('be.visible');
      });
    });

    it('Deve exibir estado vazio para pesquisa sem resultados', () => {
      cy.intercept('GET', `${apiUrl}/emprestimos*`).as('searchEmprestimos');

      cy.getByData('search-input').type('Solicitante Inexistente XYZ 999');
      cy.wait('@searchEmprestimos', { timeout: 30000 });
      cy.wait(500);

      cy.getByData('empty-state').should('be.visible');
    });
  });

  describe('Filtros de Status', () => {
    it('Deve filtrar empréstimos por status Ativo', () => {
      cy.intercept('GET', `${apiUrl}/emprestimos*`).as('filterEmprestimos');

      cy.getByData('filtros-button').click();
      cy.getByData('filtro-status-dropdown').click();
      cy.getByData('filtro-status-option-ativo').click();
      cy.getByData('aplicar-filtros-button').click();

      cy.wait('@filterEmprestimos', { timeout: 30000 }).then((interception) => {
        expect(interception.request.url).to.include('apenas_abertos=true');
      });

      cy.getByData('applied-filter-status-nome').should('contain', 'Ativo');
    });

    it('Deve filtrar empréstimos por status Atrasado', () => {
      cy.intercept('GET', `${apiUrl}/emprestimos*`).as('filterEmprestimos');

      cy.getByData('filtros-button').click();
      cy.getByData('filtro-status-dropdown').click();
      cy.getByData('filtro-status-option-atrasado').click();
      cy.getByData('aplicar-filtros-button').click();

      cy.wait('@filterEmprestimos', { timeout: 30000 }).then((interception) => {
        expect(interception.request.url).to.include('atrasados=true');
      });

      cy.getByData('applied-filter-status-nome').should('contain', 'Atrasado');
    });

    it('Deve remover filtro de status aplicado', () => {
      cy.intercept('GET', `${apiUrl}/emprestimos*`).as('filterEmprestimos');

      cy.getByData('filtros-button').click();
      cy.getByData('filtro-status-dropdown').click();
      cy.getByData('filtro-status-option-ativo').click();
      cy.getByData('aplicar-filtros-button').click();
      cy.wait('@filterEmprestimos', { timeout: 30000 });

      cy.getByData('applied-filter-status-remover').click();
      cy.getByData('applied-filters').should('not.exist');
    });
  });
});
