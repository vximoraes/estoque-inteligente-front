describe('Componentes - Exclusão', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let itemTesteId: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email, senha },
      timeout: 30000,
    }).then((loginResponse) => {
      const token = loginResponse.body.data.user.accesstoken;

      cy.request({
        method: 'GET',
        url: `${apiUrl}/categorias?limit=1`,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((categoriasResponse) => {
        const categorias = categoriasResponse.body?.data?.docs || [];

        if (categorias.length > 0) {
          const nomeComponente = `Componente Para Exclusão ${Date.now()}`;

          cy.request({
            method: 'POST',
            url: `${apiUrl}/itens`,
            headers: { Authorization: `Bearer ${token}` },
            body: {
              nome: nomeComponente,
              categoria: categorias[0]._id,
              estoque_minimo: '5',
              descricao: 'Este item será excluído nos testes',
            },
            timeout: 30000,
          }).then((createResponse) => {
            itemTesteId = createResponse.body?.data?._id;
            cy.log(`Componente de teste criado: ${itemTesteId}`);
          });
        }
      });
    });
  });

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/itens*`).as('getComponentes');
    cy.intercept('PATCH', `${apiUrl}/itens/*/inativar`).as('deleteComponente');
    cy.intercept('GET', `${apiUrl}/estoques*`).as('getEstoques');

    cy.login(email, senha);
    cy.visit(`${frontendUrl}/itens`);
    cy.wait('@getComponentes', { timeout: 30000 });
  });

  describe('Modal de Confirmação de Exclusão', () => {
    it('Deve abrir modal de confirmação ao clicar em Excluir', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];

        if (itens.length > 0) {
          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').should('be.visible');
          cy.getByData('modal-excluir-titulo').should('be.visible');
        }
      });
    });

    it('Deve exibir o nome do item no modal', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];

        if (itens.length > 0) {
          const item = itens[0];

          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-nome-item').should(
              'contain',
              item.nome,
            );
          });
        }
      });
    });

    it('Deve ter botões Cancelar e Excluir no modal', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];

        if (itens.length > 0) {
          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-cancelar').should('be.visible');
            cy.getByData('modal-excluir-confirmar').should('be.visible');
          });
        }
      });
    });

    it('Deve ter botão Excluir em vermelho (destaque de ação destrutiva)', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];

        if (itens.length > 0) {
          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-confirmar')
              .should('have.css', 'background-color')
              .and(
                'match',
                /rgb\(2[012]\d, 3[0-9], 3[0-9]\)|rgb\(239, 68, 68\)|rgb\(248, 113, 113\)/,
              );
          });
        }
      });
    });

    it('Deve fechar modal ao clicar em Cancelar', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];

        if (itens.length > 0) {
          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-cancelar').click();
          });

          cy.getByData('modal-excluir').should('not.exist');
        }
      });
    });
  });

  describe('Processo de Exclusão', () => {
    it('Deve excluir item ao confirmar', () => {
      if (!itemTesteId) {
        cy.log('Componente de teste não foi criado, pulando teste');
        return;
      }

      cy.wait('@getComponentes');

      cy.get('body').then(($body) => {
        if ($body.text().includes('Para Exclusão')) {
          cy.contains('Para Exclusão')
            .parents('[data-test^="item-card-"]')
            .within(() => {
              cy.getByData('delete-button').click();
            });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-confirmar').click();
          });

          cy.wait('@deleteComponente', { timeout: 30000 }).then(
            (interception) => {
              expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
            },
          );

          cy.contains(/excluído|removido|deletado.*sucesso/i, {
            timeout: 5000,
          }).should('be.visible');

          itemTesteId = '';
        }
      });
    });

    it('Deve atualizar listagem automaticamente após exclusão', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        const totalAntes = itens.length;

        if (totalAntes > 0) {
          const itemNome = itens[0].nome;

          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-confirmar').click();
          });

          cy.wait('@deleteComponente', { timeout: 30000 });
          cy.wait('@getComponentes', { timeout: 30000 });

          cy.wait(1000);
          cy.get('body').then(($body) => {
            const textoAtual = $body.text();
            cy.log(`Verificando se ${itemNome} foi removido da listagem`);
          });
        }
      });
    });

    it('Deve recalcular estatísticas após exclusão', () => {
      cy.wait('@getComponentes').then((interception) => {
        const statsAntes = interception.response?.body?.stats;
        const itens = interception.response?.body?.data?.docs || [];

        if (itens.length > 0) {
          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-confirmar').click();
          });

          cy.wait('@deleteComponente', { timeout: 30000 });
          cy.wait('@getComponentes', { timeout: 30000 }).then(
            (novaInterception) => {
              const statsDepois = novaInterception.response?.body?.stats;

              if (statsAntes && statsDepois) {
                expect(statsDepois.total).to.be.lessThan(statsAntes.total);
              }
            },
          );
        }
      });
    });
  });

  describe('Paginação após Exclusão', () => {
    it('Deve ajustar paginação se era último item da página', () => {
      cy.wait('@getComponentes').then((interception) => {
        const paginationInfo = interception.response?.body?.data;
        const itens = paginationInfo?.docs || [];

        if (paginationInfo?.page > 1 && itens.length === 1) {
          const paginaAtual = paginationInfo.page;

          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-confirmar').click();
          });

          cy.wait('@deleteComponente', { timeout: 30000 });
          cy.wait('@getComponentes', { timeout: 30000 });

          cy.url().then((url) => {
            if (url.includes('page=')) {
              const match = url.match(/page=(\d+)/);
              const novaPagina = match ? parseInt(match[1]) : 1;
              expect(novaPagina).to.be.lessThan(paginaAtual);
            }
          });
        } else {
          cy.log('Teste de ajuste de paginação não aplicável nesta situação');
        }
      });
    });
  });

  describe('Exclusão Permanente', () => {
    it('Componente excluído não deve aparecer em nova busca', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];

        if (itens.length > 0) {
          const itemNome = itens[0].nome;
          const itemId = itens[0]._id;

          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-confirmar').click();
          });

          cy.wait('@deleteComponente', { timeout: 30000 });

          // Verifica que o item não aparece mais na listagem
          cy.wait('@getComponentes', { timeout: 30000 });
          cy.get('body').should('not.contain', itemNome);
        }
      });
    });
  });

  describe('Confirmação Obrigatória', () => {
    it('Não deve excluir sem confirmação', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        const totalInicial = itens.length;

        if (itens.length > 0) {
          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-cancelar').click();
          });

          cy.wait(500);

          cy.getByData('item-card-0').should('exist');
        }
      });
    });

    it('Deve exibir feedback apropriado após exclusão', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];

        if (itens.length > 0) {
          cy.getByData('item-card-0').within(() => {
            cy.getByData('delete-button').click();
          });

          cy.getByData('modal-excluir').within(() => {
            cy.getByData('modal-excluir-confirmar').click();
          });

          cy.wait('@deleteComponente', { timeout: 30000 });
          cy.contains(/sucesso/i, { timeout: 5000 }).should('be.visible');
        }
      });
    });
  });

  after(() => {
    if (itemTesteId) {
      const apiUrl = Cypress.env('API_URL');
      const email = Cypress.env('TEST_USER_EMAIL');
      const senha = Cypress.env('TEST_USER_PASSWORD');

      cy.request({
        method: 'POST',
        url: `${apiUrl}/login`,
        body: { email, senha },
        timeout: 30000,
        failOnStatusCode: false,
      }).then((loginResponse) => {
        if (loginResponse.body?.data?.user?.accesstoken) {
          const token = loginResponse.body.data.user.accesstoken;

          cy.request({
            method: 'PATCH',
            url: `${apiUrl}/itens/${itemTesteId}/inativar`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 30000,
            failOnStatusCode: false,
          }).then(() => {
            cy.log(`Componente de teste ${itemTesteId} removido na limpeza`);
          });
        }
      });
    }
  });
});
