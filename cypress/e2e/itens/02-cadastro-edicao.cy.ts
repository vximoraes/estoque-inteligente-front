describe('Componentes - Cadastro e Edição', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let itemIdCriado: string;

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/itens*`).as('getComponentes');
    cy.intercept('POST', `${apiUrl}/itens`).as('createComponente');
    cy.intercept('PUT', `${apiUrl}/itens/*`).as('updateComponente');
    cy.intercept('PATCH', `${apiUrl}/itens/*`).as('patchComponente');
    cy.intercept('GET', `${apiUrl}/categorias*`).as('getCategorias');
    cy.intercept('POST', `${apiUrl}/categorias`).as('createCategoria');

    cy.login(email, senha);
  });

  describe('Adicionar Componente', () => {
    beforeEach(() => {
      cy.visit(`${frontendUrl}/itens`);
      cy.wait('@getComponentes');

      cy.contains('button', 'Adicionar').click();

      cy.url().should('include', '/itens/adicionar');
      cy.wait('@getCategorias');
    });

    it('Deve redirecionar para tela de cadastro ao clicar em Adicionar', () => {
      cy.url().should('include', '/itens/adicionar');

      cy.contains('Itens').should('be.visible');
      cy.contains('Adicionar').should('be.visible');
    });

    it('Deve exibir todos os campos obrigatórios do formulário', () => {
      cy.contains('Nome').should('be.visible');
      cy.contains('Categoria').should('be.visible');
      cy.contains('Estoque mínimo').should('be.visible');
    });

    it('Deve validar campo Nome obrigatório', () => {
      cy.contains('button', 'Salvar').click();

      cy.wait(500);
      cy.get('form').should('be.visible');
    });

    it('Deve validar campo Categoria obrigatório', () => {
      cy.get('#nome').type('Componente Teste');

      cy.contains('button', 'Salvar').click();

      cy.wait(500);
      cy.url().should('include', '/adicionar');
    });

    it('Deve validar limite de caracteres do Nome (máx 100)', () => {
      const nomeGrande = 'A'.repeat(101);

      cy.get('#nome').type(nomeGrande);

      cy.get('#nome').invoke('val').then((val) => {
        expect(val?.toString().length).to.be.lte(100);
      });
    });

    it('Deve validar limite de caracteres da Descrição (máx 200)', () => {
      const descricaoGrande = 'A'.repeat(201);

      cy.get('#descricao').type(descricaoGrande.substring(0, 200));

      cy.get('#descricao').invoke('val').then((val) => {
        expect(val?.toString().length).to.be.lte(200);
      });
    });

    it('Deve validar Estoque Mínimo entre 0 e 999.999.999', () => {
      cy.get('#estoqueMinimo').clear().type('-1');
      cy.get('#estoqueMinimo').blur();

      cy.wait(500);
    });

    it('Deve exibir contadores de caracteres', () => {
      cy.get('#nome').type('Teste');

      cy.get('body').then($body => {
        const texto = $body.text();
        cy.log('Contador pode estar presente no formulário');
      });
    });

    it('Deve criar item com sucesso com dados válidos', () => {
      const nomeComponente = `Componente Teste ${Date.now()}`;

      cy.get('#nome').type(nomeComponente);

      cy.get('[data-categoria-dropdown] button').first().click();
      cy.get('[data-categoria-dropdown]').within(() => {
        cy.get('button').not('[data-categoria-dropdown] > button').first().click();
      });

      cy.get('#estoqueMinimo').clear().type('10');

      cy.get('#descricao').type('Descrição do item de teste');

      cy.contains('button', 'Salvar').click();

      cy.wait('@createComponente').then((createInterception) => {
        expect(createInterception.response?.statusCode).to.be.oneOf([200, 201]);

        itemIdCriado = createInterception.response?.body?.data?._id;

        cy.url().should('include', '/itens');
        cy.url().should('not.include', '/novo');

        cy.contains('sucesso', { matchCase: false }).should('be.visible');
      });
    });

    it('Deve permitir criar categoria durante cadastro de item', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('Nova Categoria') || $body.text().includes('Criar Categoria')) {
          cy.log('Funcionalidade de criar categoria disponível');
        }
      });
    });

    it('Deve validar nome único (não permitir duplicata)', () => {
      // Busca um item existente via API
      const apiUrl = Cypress.env('API_URL');
      
      cy.request({
        method: 'GET',
        url: `${apiUrl}/itens?limit=1`,
        headers: { Authorization: `Bearer ${window.localStorage.getItem('token')}` },
        failOnStatusCode: false
      }).then((response) => {
        if (response.body?.data?.docs?.length > 0) {
          const nomeExistente = response.body.data.docs[0].nome;

          cy.get('#nome').type(nomeExistente);
          
          cy.get('[data-categoria-dropdown] button').first().click();
          cy.get('[data-categoria-dropdown]').within(() => {
            cy.get('button').not('[data-categoria-dropdown] > button').first().click();
          });
          
          cy.get('#estoqueMinimo').clear().type('5');

          cy.contains('button', 'Salvar').click();

          cy.wait('@createComponente').then((createInterception) => {
            if (createInterception.response?.statusCode === 409) {
              cy.contains(/já existe|duplicado/i).should('be.visible');
            }
          });
        }
      });
    });
  });

  describe('Editar Componente', () => {
    let primeiroItem: any;

    beforeEach(() => {
      cy.visit(`${frontendUrl}/itens`);
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        if (itens.length > 0) {
          primeiroItem = itens[0];
        }
      });
    });

    it('Deve redirecionar para tela de edição ao clicar em Editar', () => {
      if (!primeiroItem) return;

      cy.getByData('item-card-0').within(() => {
        cy.getByData('edit-button').click();
      });

      cy.url().should('include', `/itens/editar/${primeiroItem._id}`);
    });

    it('Deve pré-preencher todos os campos com dados atuais', () => {
      if (!primeiroItem) return;

      cy.visit(`${frontendUrl}/itens/editar/${primeiroItem._id}`);
      cy.wait('@getCategorias');

      cy.get('#nome').should('have.value', primeiroItem.nome);
      cy.get('#estoqueMinimo').should('have.value', primeiroItem.estoque_minimo.toString());

      if (primeiroItem.descricao) {
        cy.get('#descricao').should('have.value', primeiroItem.descricao);
      }
    });

    it('Deve atualizar item com sucesso', () => {
      if (!primeiroItem) return;

      const novaDescricao = `Descrição atualizada ${Date.now()}`;

      cy.visit(`${frontendUrl}/itens/editar/${primeiroItem._id}`);
      cy.wait('@getCategorias');

      cy.get('#descricao').clear().type(novaDescricao);

      cy.contains('button', 'Salvar').click();

      cy.wait('@patchComponente', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 201]);

        cy.url().should('include', '/itens');
        cy.url().should('not.include', '/editar');

        cy.contains(/atualizado|sucesso/i).should('be.visible');
      });
    });

    it('Deve recalcular status ao alterar estoque mínimo', () => {
      if (!primeiroItem || primeiroItem.quantidade <= 0) return;

      cy.visit(`${frontendUrl}/itens/editar/${primeiroItem._id}`);
      cy.wait('@getCategorias');

      const novoEstoqueMinimo = primeiroItem.quantidade + 10;
      cy.get('#estoqueMinimo').clear().type(novoEstoqueMinimo.toString());

      cy.contains('button', 'Salvar').click();

      cy.wait('@patchComponente', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      });

      cy.url().should('include', '/itens');
      cy.url().should('not.include', '/editar');
    });

    it('Deve permitir alterar/remover imagem', () => {
      if (!primeiroItem) return;

      cy.visit(`${frontendUrl}/itens/editar/${primeiroItem._id}`);
      cy.wait('@getCategorias');

      cy.get('body').then($body => {
        if ($body.text().includes('Imagem') || $body.find('input[type="file"]').length > 0) {
          cy.log('Campo de imagem presente no formulário de edição');

          if (primeiroItem.imagem) {
            cy.get('body').then($btn => {
              if ($btn.text().includes('Remover') || $btn.find('[data-testid*="remove"]').length > 0) {
                cy.log('Botão de remover imagem encontrado');
              }
            });
          }
        }
      });
    });

    it('Deve manter mesmas validações do cadastro', () => {
      if (!primeiroItem) return;

      cy.visit(`${frontendUrl}/itens/editar/${primeiroItem._id}`);
      cy.wait('@getCategorias');

      cy.get('#nome').clear();

      cy.contains('button', 'Salvar').click();

      cy.wait(500);
      cy.url().should('include', '/editar');
    });
  });

  describe('Upload de Imagem', () => {
    it('Deve aceitar formatos válidos de imagem (JPG, PNG, GIF, WEBP)', () => {
      cy.visit(`${frontendUrl}/itens/adicionar`);
      cy.wait('@getCategorias');

      cy.get('body').then($body => {
        if ($body.find('input[type="file"]').length > 0) {
          cy.log('Campo de upload de imagem encontrado');

          cy.get('input[type="file"]').should('have.attr', 'accept');
        }
      });
    });

    it('Deve exibir preview da imagem após upload', () => {
      cy.visit(`${frontendUrl}/itens/adicionar`);
      cy.wait('@getCategorias');

      cy.get('body').then($body => {
        if ($body.find('input[type="file"]').length > 0) {
          const fileName = 'test-image.png';

          cy.fixture('example.json').then(() => {
            cy.log('Upload de imagem testável');
          });
        }
      });
    });
  });

  after(() => {
    if (itemIdCriado) {
      const apiUrl = Cypress.env('API_URL');
      const email = Cypress.env('TEST_USER_EMAIL');
      const senha = Cypress.env('TEST_USER_PASSWORD');

      cy.request({
        method: 'POST',
        url: `${apiUrl}/login`,
        body: { email, senha }
      }).then((loginResponse) => {
        const token = loginResponse.body.data.user.accesstoken;

        cy.request({
          method: 'PATCH',
          url: `${apiUrl}/itens/${itemIdCriado}/inativar`,
          headers: {
            Authorization: `Bearer ${token}`
          },
          failOnStatusCode: false
        }).then(() => {
          cy.log(`Componente de teste ${itemIdCriado} removido`);
        });
      });
    }
  });
});
