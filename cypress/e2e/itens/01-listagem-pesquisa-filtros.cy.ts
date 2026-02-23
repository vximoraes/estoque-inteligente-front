describe('Componentes - Listagem, Pesquisa e Filtros', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let authToken: string;
  let primeiroItem: any;
  let primeiraCategoria: any;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email, senha }
    }).then((response) => {
      expect(response.status).to.eq(200);
      authToken = response.body.data.user.accesstoken;

      cy.request({
        method: 'GET',
        url: `${apiUrl}/itens?limit=1`,
        headers: { Authorization: `Bearer ${authToken}` }
      }).then((compResponse) => {
        expect(compResponse.status).to.eq(200);
        if (compResponse.body.data.docs.length > 0) {
          primeiroItem = compResponse.body.data.docs[0];
        }
      });

      cy.request({
        method: 'GET',
        url: `${apiUrl}/categorias?limit=1`,
        headers: { Authorization: `Bearer ${authToken}` }
      }).then((catResponse) => {
        expect(catResponse.status).to.eq(200);
        if (catResponse.body.data.docs.length > 0) {
          primeiraCategoria = catResponse.body.data.docs[0];
        }
      });
    });
  });

  beforeEach(() => {
    cy.intercept('GET', '**/itens*').as('getComponentes');
    cy.intercept('GET', '**/categorias*').as('getCategorias');

    cy.visit(`${frontendUrl}/login`);
    cy.get('[data-test="email-input"]').should('be.visible').clear().type(email);
    cy.get('[data-test="senha-input"]').should('be.visible').clear().type(senha);
    cy.get('[data-test="botao-entrar"]').click();

    cy.url({ timeout: 30000 }).should('include', '/itens');
    cy.get('[data-test="itens-page"]', { timeout: 30000 }).should('exist');
    cy.wait('@getComponentes');
  });

  describe('Listagem de Componentes', () => {
    it('exibe grid de itens após login', () => {
      cy.get('[data-test="itens-grid"]').should('be.visible');
      cy.get('[data-test^="item-card-"]').should('have.length.at.least', 1);
    });

    it('exibe informações do item no card', () => {
      cy.get('[data-test="item-card-0"]').should('be.visible');
      cy.get('[data-test="item-card-0"]').within(() => {
        cy.get('[data-test="component-name"]').should('not.be.empty');
        cy.get('[data-test="component-category"]').should('exist');
        cy.get('[data-test="status-badge"]').should('exist')
          .invoke('text').should('match', /Em Estoque|Baixo Estoque|Indisponível/);
        cy.get('[data-test="quantity"]').should('contain.text', 'Qtd:');
        cy.get('[data-test="edit-button"]').should('exist');
        cy.get('[data-test="delete-button"]').should('exist');
        cy.get('[data-test="entrada-icon"]').should('exist');
        cy.get('[data-test="saida-icon"]').should('exist');
      });
    });

    it('exibe estatísticas de itens', () => {
      cy.viewport(1280, 720);
      cy.get('[data-test="stat-total-itens"]').should('exist');
      cy.get('[data-test="stat-em-estoque"]').should('exist');
      cy.get('[data-test="stat-baixo-estoque"]').should('exist');
      cy.get('[data-test="stat-indisponiveis"]').should('exist');
    });
  });

  describe('Pesquisa', () => {
    it('filtra itens por nome', () => {
      expect(primeiroItem).to.not.be.undefined;

      cy.intercept('GET', '**/itens*').as('searchRequest');
      cy.get('[data-test="search-input"]').clear().type(primeiroItem.nome);
      cy.wait('@searchRequest');
      cy.contains(primeiroItem.nome).should('be.visible');
    });

    it('exibe mensagem quando não encontra resultados', () => {
      cy.intercept('GET', '**/itens*').as('searchRequest');
      cy.get('[data-test="search-input"]').clear().type('XYZABC123456NAOEXISTE');
      cy.wait('@searchRequest');
      cy.wait(500);
      cy.get('[data-test="empty-state"]', { timeout: 15000 }).should('be.visible');
      cy.contains('Nenhum item encontrado para sua pesquisa.').should('be.visible');
    });

    it('restaura listagem ao limpar busca', () => {
      cy.intercept('GET', '**/itens*').as('searchRequest');
      cy.get('[data-test="search-input"]').clear().type('teste');
      cy.wait('@searchRequest');
      cy.get('[data-test="search-input"]').clear();
      cy.wait('@searchRequest');
      cy.get('[data-test="itens-grid"]').should('be.visible');
    });
  });

  describe('Filtros', () => {
    it('abre modal de filtros com opções corretas', () => {
      cy.get('[data-test="filtros-button"]').click();
      cy.get('[data-test="filtro-categoria-container"]').should('be.visible');
      cy.get('[data-test="filtro-status-container"]').should('be.visible');
      cy.get('[data-test="aplicar-filtros-button"]').should('be.visible');
      cy.get('[data-test="limpar-filtros-button"]').should('be.visible');
    });

    it('aplica filtro de status Em Estoque', () => {
      cy.get('[data-test="filtros-button"]').click();
      cy.get('[data-test="filtro-status-dropdown"]').click();
      cy.contains('Em Estoque').click();
      cy.intercept('GET', '**/itens*').as('filterRequest');
      cy.get('[data-test="aplicar-filtros-button"]').click();
      cy.wait('@filterRequest');
      cy.get('[data-test="applied-filters"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-test="applied-filters"]').should('contain', 'Em Estoque');
    });

    it('aplica filtro de status Baixo Estoque', () => {
      cy.get('[data-test="filtros-button"]').click();
      cy.get('[data-test="filtro-status-dropdown"]').click();
      cy.contains('Baixo Estoque').click();
      cy.intercept('GET', '**/itens*').as('filterRequest');
      cy.get('[data-test="aplicar-filtros-button"]').click();
      cy.wait('@filterRequest');
      cy.get('[data-test="applied-filters"]', { timeout: 10000 }).should('contain', 'Baixo Estoque');
    });

    it('aplica filtro de status Indisponível', () => {
      cy.get('[data-test="filtros-button"]').click();
      cy.get('[data-test="filtro-status-dropdown"]').click();
      cy.wait(200);
      cy.contains('button', 'Indisponível').click({ force: true });
      cy.intercept('GET', '**/itens*').as('filterRequest');
      cy.get('[data-test="aplicar-filtros-button"]').click();
      cy.wait('@filterRequest');
      cy.get('[data-test="applied-filters"]', { timeout: 10000 }).should('contain', 'Indisponível');
    });

    it('remove filtro ao clicar no X', () => {
      cy.get('[data-test="filtros-button"]').click();
      cy.get('[data-test="filtro-status-dropdown"]').click();
      cy.contains('Em Estoque').click();
      cy.intercept('GET', '**/itens*').as('filterRequest');
      cy.get('[data-test="aplicar-filtros-button"]').click();
      cy.wait('@filterRequest');
      cy.get('[data-test="applied-filters"]').should('be.visible');
      cy.get('[data-test="applied-filters"]').find('button').first().click();
      cy.get('[data-test="applied-filters"]').should('not.exist');
    });

    it('aplica filtro de categoria', () => {
      if (!primeiraCategoria) {
        cy.log('Nenhuma categoria disponível');
        return;
      }

      cy.get('[data-test="filtros-button"]').click();
      cy.wait('@getCategorias');
      cy.get('[data-test="filtro-categoria-dropdown"]').click();
      cy.wait(300);
      cy.contains(primeiraCategoria.nome).click();
      cy.intercept('GET', '**/itens*').as('filterCategoria');
      cy.get('[data-test="aplicar-filtros-button"]').click();
      cy.wait('@filterCategoria');
      cy.get('[data-test="applied-filters"]', { timeout: 10000 }).should('contain', 'Categoria');
    });

    it('limpa filtros pelo modal', () => {
      cy.get('[data-test="filtros-button"]').click();
      cy.get('[data-test="filtro-status-dropdown"]').click();
      cy.contains('Em Estoque').click();
      cy.get('[data-test="aplicar-filtros-button"]').click();
      cy.get('[data-test="applied-filters"]').should('be.visible');
      cy.get('[data-test="filtros-button"]').click();
      cy.get('[data-test="limpar-filtros-button"]').click();
      cy.get('[data-test="applied-filters"]').should('not.exist');
    });

    it('fecha modal ao clicar fora', () => {
      cy.get('[data-test="filtros-button"]').click();
      cy.get('[data-test="filtro-categoria-container"]').should('be.visible');
      cy.get('body').click(0, 0);
      cy.get('[data-test="filtro-categoria-container"]').should('not.exist');
    });
  });

  describe('Navegação', () => {
    it('redireciona para adicionar item', () => {
      cy.get('[data-test="adicionar-button"]').click();
      cy.url().should('include', '/itens/adicionar');
    });

    it('redireciona para editar item ao clicar no botão editar', () => {
      cy.get('[data-test="item-card-0"]').within(() => {
        cy.get('[data-test="edit-button"]').click();
      });
      cy.url().should('include', '/itens/editar/');
    });
  });

  describe('Interações com Card', () => {
    it('abre modal de localizações ao clicar no card', () => {
      cy.intercept('GET', '**/estoques/item/*').as('getEstoques');
      cy.get('[data-test="item-card-0"]').click();
      cy.wait('@getEstoques');
      cy.get('[data-test="modal-localizacoes"]').should('be.visible');
      cy.get('[data-test="modal-localizacoes-titulo"]').should('not.be.empty');
      cy.get('[data-test="modal-localizacoes-total"]').should('be.visible');
    });

    it('fecha modal de localizações ao clicar no X', () => {
      cy.intercept('GET', '**/estoques/item/*').as('getEstoques');
      cy.get('[data-test="item-card-0"]').click();
      cy.wait('@getEstoques');
      cy.get('[data-test="modal-localizacoes"]').should('be.visible');
      cy.get('[data-test="modal-localizacoes-close"]').click();
      cy.get('[data-test="modal-localizacoes"]').should('not.exist');
    });
  });
});
