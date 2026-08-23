describe('Empréstimos - Devolução', () => {
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
        body: { nome: `Categoria Emprestimo Devolucao ${unique}` },
      }).then((categoriaResponse) => {
        const categoria = categoriaResponse.body.data._id;

        cy.request({
          method: 'POST',
          url: `${apiUrl}/localizacoes`,
          headers: { Authorization: `Bearer ${authToken}` },
          body: { nome: `Localizacao Emprestimo Devolucao ${unique}` },
        }).then((localizacaoResponse) => {
          localizacao = localizacaoResponse.body.data._id;

          cy.request({
            method: 'POST',
            url: `${apiUrl}/itens`,
            headers: { Authorization: `Bearer ${authToken}` },
            body: {
              nome: `Item Emprestimo Devolucao ${unique}`,
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
    solicitanteTeste = `Solicitante Devolucao ${Date.now()}`;

    cy.request({
      method: 'POST',
      url: `${apiUrl}/emprestimos`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        item,
        localizacao,
        quantidade_emprestada: 5,
        solicitante_nome: solicitanteTeste,
      },
    }).then((emprestimoResponse) => {
      emprestimoTesteId = emprestimoResponse.body.data._id;
    });

    cy.intercept('GET', `${apiUrl}/emprestimos*`).as('getEmprestimos');
    cy.intercept('PATCH', `${apiUrl}/emprestimos/*/devolver`).as(
      'devolverEmprestimo',
    );
    cy.intercept('PATCH', `${apiUrl}/emprestimos/*/desfazer-devolucao`).as(
      'desfazerDevolucao',
    );

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

  it('Deve abrir modal de devolução ao clicar em Devolver', () => {
    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('devolver-button').click();
      });

    cy.getByData('modal-devolver-item').should('be.visible');
  });

  it('Deve registrar devolução parcial e manter status Ativo', () => {
    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('devolver-button').click();
      });

    cy.getByData('modal-devolver-item').within(() => {
      cy.getByData('modal-devolver-item-quantidade').clear().type('2');
      cy.getByData('modal-devolver-item-confirmar').click();
    });

    cy.wait('@devolverEmprestimo', { timeout: 30000 }).then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body?.data?.quantidade_devolvida).to.eq(2);
      expect(interception.response?.body?.data?.status).to.eq('Ativo');
    });

    cy.getByData('modal-devolver-item').should('not.exist');
  });

  it('Deve registrar devolução total e mudar status para Devolvido', () => {
    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('devolver-button').click();
      });

    cy.getByData('modal-devolver-item').within(() => {
      cy.getByData('modal-devolver-item-quantidade').clear().type('5');
      cy.getByData('modal-devolver-item-confirmar').click();
    });

    cy.wait('@devolverEmprestimo', { timeout: 30000 }).then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body?.data?.status).to.eq('Devolvido');
    });

    cy.wait('@getEmprestimos', { timeout: 30000 });
    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('devolver-button').should('be.disabled');
      });
  });

  it('Não deve permitir devolver quantidade maior que o saldo em aberto', () => {
    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('devolver-button').click();
      });

    cy.getByData('modal-devolver-item').within(() => {
      cy.getByData('modal-devolver-item-quantidade').clear().type('999');
      cy.getByData('modal-devolver-item-confirmar').click();
      cy.contains('não pode ser maior que o saldo em aberto').should(
        'be.visible',
      );
    });

    cy.get('@devolverEmprestimo.all').should('have.length', 0);
  });

  it('Deve desfazer devolução via modal de edição', () => {
    cy.request({
      method: 'PATCH',
      url: `${apiUrl}/emprestimos/${emprestimoTesteId}/devolver`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { quantidade_devolvida: 5 },
    });

    cy.visit(`${frontendUrl}/emprestimos`);
    cy.wait('@getEmprestimos', { timeout: 30000 });

    cy.contains(solicitanteTeste)
      .parents('tr')
      .first()
      .within(() => {
        cy.getByData('editar-button').click();
      });

    cy.getByData('modal-editar-emprestimo').should('be.visible');
    cy.getByData('modal-editar-emprestimo-desfazer-devolucao').click();
    cy.getByData(
      'modal-editar-emprestimo-desfazer-devolucao-confirmar',
    ).click();

    cy.wait('@desfazerDevolucao', { timeout: 30000 }).then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body?.data?.status).to.eq('Ativo');
    });

    cy.getByData('modal-editar-emprestimo').should('not.exist');
  });
});
