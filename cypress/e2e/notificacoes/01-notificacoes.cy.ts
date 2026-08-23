describe('Notificações', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');
  const min = 5;

  let authToken: string;
  let categoria: string;
  let localizacao: string;

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
        body: { nome: `Categoria Notificacoes ${unique}` },
      }).then((categoriaResponse) => {
        categoria = categoriaResponse.body.data._id;
      });

      cy.request({
        method: 'POST',
        url: `${apiUrl}/localizacoes`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { nome: `Localizacao Notificacoes ${unique}` },
      }).then((localizacaoResponse) => {
        localizacao = localizacaoResponse.body.data._id;
      });
    });
  });

  const criarItemTeste = (sufixo: string) => {
    const nome = `Item Notificacoes ${sufixo} ${Date.now()}`;
    return cy
      .request({
        method: 'POST',
        url: `${apiUrl}/itens`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { nome, categoria, estoque_minimo: String(min) },
      })
      .then((response) => ({
        itemId: response.body.data._id as string,
        itemNome: nome,
      }));
  };

  const movimentar = (
    itemId: string,
    tipo: 'entrada' | 'saida',
    quantidade: number,
  ) => {
    return cy.request({
      method: 'POST',
      url: `${apiUrl}/movimentacoes`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { tipo, quantidade: String(quantidade), item: itemId, localizacao },
    });
  };

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/itens*`).as('getItens');
    cy.login(email, senha);
  });

  it('Deve gerar notificação "em estoque" ao registrar entrada que atinge o mínimo', () => {
    criarItemTeste('EmEstoque').then(({ itemNome }) => {
      cy.visit(`${frontendUrl}/itens`);
      cy.wait('@getItens', { timeout: 30000 });

      cy.intercept('GET', `${apiUrl}/itens*`).as('searchItens');
      cy.get('[data-test="search-input"]').type(itemNome);
      cy.wait('@searchItens', { timeout: 30000 });
      cy.wait(500);

      cy.contains(itemNome)
        .parents('[data-test^="item-card-"]')
        .find('[data-test="entrada-icon"]')
        .click();
      cy.get('[data-test="modal-entrada-quantidade-input"]').type('10');
      cy.get('[data-test="modal-entrada-localizacao-dropdown"]').click();
      cy.get('[data-test="modal-entrada-localizacao-dropdown"]')
        .parent()
        .find('button:not([data-test="modal-entrada-localizacao-dropdown"])')
        .first()
        .click();
      cy.get('[data-test="modal-entrada-confirmar"]').click();
      cy.wait(2000);

      cy.get('[data-test="botao-notificacoes"]').click();
      cy.contains('[data-test="mensagem-notificacao"]', itemNome, {
        timeout: 10000,
      }).should('contain', 'está em estoque (10 unidades)');
    });
  });

  it('Deve gerar notificação "estoque baixo" ao cair abaixo do mínimo', () => {
    criarItemTeste('BaixoEstoque').then(({ itemId, itemNome }) => {
      movimentar(itemId, 'entrada', 10);

      cy.visit(`${frontendUrl}/itens`);
      cy.wait('@getItens', { timeout: 30000 });

      cy.intercept('GET', `${apiUrl}/itens*`).as('searchItens');
      cy.get('[data-test="search-input"]').type(itemNome);
      cy.wait('@searchItens', { timeout: 30000 });
      cy.wait(500);

      cy.contains(itemNome)
        .parents('[data-test^="item-card-"]')
        .find('[data-test="saida-icon"]')
        .click();
      cy.get('[data-test="modal-saida-quantidade-input"]').type('7');
      cy.get('[data-test="modal-saida-localizacao-dropdown"]').click();
      cy.get('[data-test="modal-saida-localizacao-dropdown"]')
        .parent()
        .find('button:not([data-test="modal-saida-localizacao-dropdown"])')
        .first()
        .click();
      cy.get('[data-test="modal-saida-confirmar"]').click();
      cy.wait(2000);

      cy.get('[data-test="botao-notificacoes"]').click();
      cy.contains('[data-test="mensagem-notificacao"]', itemNome, {
        timeout: 10000,
      }).should('contain', 'está com estoque baixo (3 unidades)');
    });
  });

  it('Deve gerar notificação "indisponível" ao zerar o estoque', () => {
    criarItemTeste('Indisponivel').then(({ itemId, itemNome }) => {
      movimentar(itemId, 'entrada', 3);

      cy.visit(`${frontendUrl}/itens`);
      cy.wait('@getItens', { timeout: 30000 });

      cy.intercept('GET', `${apiUrl}/itens*`).as('searchItens');
      cy.get('[data-test="search-input"]').type(itemNome);
      cy.wait('@searchItens', { timeout: 30000 });
      cy.wait(500);

      cy.contains(itemNome)
        .parents('[data-test^="item-card-"]')
        .find('[data-test="saida-icon"]')
        .click();
      cy.get('[data-test="modal-saida-quantidade-input"]').type('3');
      cy.get('[data-test="modal-saida-localizacao-dropdown"]').click();
      cy.get('[data-test="modal-saida-localizacao-dropdown"]')
        .parent()
        .find('button:not([data-test="modal-saida-localizacao-dropdown"])')
        .first()
        .click();
      cy.get('[data-test="modal-saida-confirmar"]').click();
      cy.wait(2000);

      cy.get('[data-test="botao-notificacoes"]').click();
      cy.contains('[data-test="mensagem-notificacao"]', itemNome, {
        timeout: 10000,
      }).should('contain', 'está indisponível (0 unidades)');
    });
  });

  it('Deve marcar uma notificação individual como visualizada', () => {
    criarItemTeste('MarcarVista').then(({ itemId }) => {
      movimentar(itemId, 'entrada', 10);
      cy.wait(500);

      cy.visit(`${frontendUrl}/itens`);
      cy.wait('@getItens', { timeout: 30000 });

      cy.get('[data-test="botao-notificacoes"]').click();
      cy.get('[data-test="indicador-nao-lida"]').should(
        'have.length.at.least',
        1,
      );

      cy.get('[data-test="item-notificacao"]')
        .first()
        .find('[data-test="indicador-nao-lida"]')
        .click();
      cy.wait(1000);

      cy.get('[data-test="item-notificacao"]')
        .first()
        .find('[data-test="indicador-nao-lida"]')
        .should('not.exist');
    });
  });

  it('Deve marcar todas as notificações como visualizadas', () => {
    criarItemTeste('MarcarTodas').then(({ itemId, itemNome }) => {
      movimentar(itemId, 'entrada', 10);
      cy.wait(300);
      movimentar(itemId, 'saida', 7);
      cy.wait(300);
      movimentar(itemId, 'saida', 3);
      cy.wait(500);

      cy.visit(`${frontendUrl}/itens`);
      cy.wait('@getItens', { timeout: 30000 });

      cy.get('[data-test="botao-notificacoes"]').click({ force: true });
      cy.wait(1000);

      cy.get('[data-test="indicador-nao-lida"]').should(
        'have.length.at.least',
        2,
      );

      cy.get('[data-test="botao-marcar-todas-visualizadas"]').click();
      cy.wait(2000);

      cy.get('[data-test="indicador-nao-lida"]').should('not.exist');
      cy.contains(itemNome).should('exist');
    });
  });
});
