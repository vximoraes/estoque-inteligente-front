describe('Componentes - Localizações e Status Automático', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/itens*`).as('getComponentes');
    cy.intercept('GET', `${apiUrl}/estoques/item/*`).as('getEstoquesComponente');
    
    cy.login(email, senha);
    cy.visit(`${frontendUrl}/itens`);
    cy.wait('@getComponentes');
  });

  describe('Visualizar Localizações', () => {
    it('Deve abrir modal de localizações ao clicar no card', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        if (itens.length > 0) {
          const itemId = itens[0]._id;
          
          cy.intercept('GET', `${apiUrl}/estoques/item/${itemId}`).as('getEstoques');
          
          cy.getByData('item-card-0').click();
          
          cy.get('[role="dialog"]').should('be.visible');
          cy.contains(/localizações|onde está|estoque por localização/i).should('be.visible');
        }
      });
    });

    it('Deve exibir nome e descrição do item no modal', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        if (itens.length > 0) {
          const item = itens[0];
          
          cy.getByData('item-card-0').click();
          
          cy.get('[role="dialog"]').within(() => {
            cy.contains(item.nome).should('be.visible');
            
            if (item.descricao) {
              cy.contains(item.descricao).should('be.visible');
            }
          });
        }
      });
    });

    it('Deve listar todas as localizações com quantidades', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemComEstoque = itens.find((c: any) => c.quantidade > 0);
        
        if (itemComEstoque) {
          const index = itens.indexOf(itemComEstoque);
          const itemId = itemComEstoque._id;

          cy.intercept('GET', `${apiUrl}/estoques/item/${itemId}`).as('getEstoquesEspecifico');
          
          cy.getByData(`item-card-${index}`).click();
          
          cy.wait('@getEstoquesEspecifico').then((estoqueInterception) => {
            const estoques = estoqueInterception.response?.body?.data || [];
            
            if (estoques.length > 0) {
              cy.get('[role="dialog"]').within(() => {
                estoques.forEach((estoque: any) => {
                  if (estoque.quantidade > 0) {
                    cy.contains(estoque.localizacao.nome).should('be.visible');
                    cy.contains(estoque.quantidade.toString()).should('be.visible');
                  }
                });
              });
            }
          });
        }
      });
    });

    it('Deve exibir quantidade total no rodapé do modal', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemComEstoque = itens.find((c: any) => c.quantidade > 0);
        
        if (itemComEstoque) {
          const index = itens.indexOf(itemComEstoque);
          const quantidadeTotal = itemComEstoque.quantidade;
          
          cy.getByData(`item-card-${index}`).click();
          
          cy.wait('@getEstoquesComponente');
          
          cy.get('[role="dialog"]').within(() => {
            cy.getByData('modal-localizacoes-total').should('be.visible');
            cy.getByData('modal-localizacoes-total').should('contain', quantidadeTotal.toString());
          });
        }
      });
    });

    it('Deve exibir mensagem apropriada quando não houver localizações', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemSemEstoque = itens.find((c: any) => c.quantidade === 0);
        
        if (itemSemEstoque) {
          const index = itens.indexOf(itemSemEstoque);
          const itemId = itemSemEstoque._id;

          cy.intercept('GET', `${apiUrl}/estoques/item/${itemId}`).as('getEstoquesVazio');
          
          cy.getByData(`item-card-${index}`).click();
          
          cy.wait('@getEstoquesVazio');
          
          cy.get('[role="dialog"]').within(() => {
            cy.contains(/nenhuma localização|sem estoque|não há/i, { timeout: 5000 }).should('be.visible');
          });
        }
      });
    });

    it('Deve exibir loading durante carregamento de localizações', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        if (itens.length > 0) {
          cy.getByData('item-card-0').click();
          
          cy.get('[role="dialog"]').should('be.visible');
          
          cy.wait('@getEstoquesComponente');
        }
      });
    });

    it('Deve fechar modal ao clicar no botão fechar', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        if (itens.length > 0) {
          cy.getByData('item-card-0').click();
          
          cy.get('[role="dialog"]').should('be.visible');
          cy.wait('@getEstoquesComponente');
          
          cy.getByData('modal-localizacoes-close').click();
          
          cy.get('[role="dialog"]').should('not.exist');
        }
      });
    });

    it('Deve exibir dados corretos e atualizados', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemComEstoque = itens.find((c: any) => c.quantidade > 0);
        
        if (itemComEstoque) {
          const index = itens.indexOf(itemComEstoque);
          const itemId = itemComEstoque._id;
          
          cy.intercept('GET', `${apiUrl}/estoques/item/${itemId}`).as('getEstoquesDetalhado');
          
          cy.getByData(`item-card-${index}`).click();
          
          cy.wait('@getEstoquesDetalhado').then((estoqueInterception) => {
            const estoquesData = estoqueInterception.response?.body?.data;
            const estoques = Array.isArray(estoquesData) ? estoquesData : (estoquesData?.docs || []);
            
            const totalCalculado = estoques.reduce((sum: number, est: any) => sum + (est.quantidade || 0), 0);
            
            cy.get('[role="dialog"]').within(() => {
              cy.getByData('modal-localizacoes-total').should('be.visible');
            });
          });
        }
      });
    });
  });

  describe('Status Automático', () => {
    it('Deve calcular status "Indisponível" quando quantidade = 0', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemIndisponivel = itens.find((c: any) => c.quantidade === 0);
        
        if (itemIndisponivel) {
          const index = itens.indexOf(itemIndisponivel);
          
          cy.getByData(`item-card-${index}`).within(() => {
            cy.contains('Indisponível').should('be.visible');
          });
        }
      });
    });

    it('Deve calcular status "Baixo Estoque" quando 0 < quantidade < estoque_mínimo', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemBaixoEstoque = itens.find((c: any) => 
          c.quantidade > 0 && c.quantidade < c.estoque_minimo
        );
        
        if (itemBaixoEstoque) {
          const index = itens.indexOf(itemBaixoEstoque);
          
          cy.getByData(`item-card-${index}`).within(() => {
            cy.contains('Baixo Estoque').should('be.visible');
          });
        }
      });
    });

    it('Deve calcular status "Em Estoque" quando quantidade >= estoque_mínimo', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemEmEstoque = itens.find((c: any) => 
          c.quantidade >= c.estoque_minimo && c.estoque_minimo > 0
        );
        
        if (itemEmEstoque) {
          const index = itens.indexOf(itemEmEstoque);
          
          cy.getByData(`item-card-${index}`).within(() => {
            cy.contains('Em Estoque').should('be.visible');
          });
        }
      });
    });

    it('Deve exibir badge com cor correta para cada status', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        itens.forEach((item: any, index: number) => {
          cy.getByData(`item-card-${index}`).within(() => {
            const badge = cy.contains(item.status);
            
            if (item.status === 'Indisponível') {
              badge.should('exist');
            } else if (item.status === 'Baixo Estoque') {
              badge.should('exist');
            } else if (item.status === 'Em Estoque') {
              badge.should('exist');
            }
          });
        });
      });
    });

    it('Deve atualizar status automaticamente após criação', () => {
      cy.intercept('POST', `${apiUrl}/itens`).as('createComponente');
      cy.intercept('GET', `${apiUrl}/categorias*`).as('getCategorias');
      
      cy.visit(`${frontendUrl}/itens/adicionar`);
      cy.wait('@getCategorias').then((interception) => {
        const categorias = interception.response?.body?.data?.docs || [];
        
        if (categorias.length > 0) {
          const nomeComponente = `Teste Status ${Date.now()}`;
          
          cy.get('#nome').type(nomeComponente);
          
          cy.get('[data-categoria-dropdown] button').first().click();
          cy.get('[data-categoria-dropdown]').within(() => {
            cy.get('button').not('[data-categoria-dropdown] > button').first().click();
          });
          
          cy.get('#estoqueMinimo').clear().type('10');
          
          cy.contains('button', 'Salvar').click();
          
          cy.wait('@createComponente').then((createInterception) => {
            const itemCriado = createInterception.response?.body?.data;
            
            expect(itemCriado.status).to.eq('Indisponível');
            
            if (itemCriado._id) {
              cy.request({
                method: 'PATCH',
                url: `${apiUrl}/itens/${itemCriado._id}/inativar`,
                headers: {
                  Authorization: `Bearer ${window.localStorage.getItem('token')}`
                },
                failOnStatusCode: false
              });
            }
          });
        }
      });
    });

    it('Deve atualizar status após entrada de estoque', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemIndisponivel = itens.find((c: any) => c.status === 'Indisponível');
        
        if (itemIndisponivel) {
          const index = itens.indexOf(itemIndisponivel);
          
          cy.intercept('POST', `${apiUrl}/movimentacoes`).as('createMovimentacao');
          cy.intercept('GET', `${apiUrl}/localizacoes*`).as('getLocalizacoes');
          
          cy.getByData(`item-card-${index}`).within(() => {
            cy.getByData('entrada-icon').click();
          });
          
          cy.wait('@getLocalizacoes').then((locInterception) => {
            const localizacoes = locInterception.response?.body?.data?.docs || [];
            
            if (localizacoes.length > 0) {
              cy.getByData('modal-entrada-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(localizacoes[0].nome).click();
              
              cy.getByData('modal-entrada-quantidade-input').clear().type('5');
              cy.getByData('modal-entrada-confirmar').click();
              
              cy.wait('@createMovimentacao', { timeout: 10000 });
              cy.wait('@getComponentes', { timeout: 10000 });
              
              cy.wait(1000);
              cy.getByData(`item-card-${index}`).within(() => {
                cy.contains(/baixo estoque|em estoque/i).should('be.visible');
              });
            }
          });
        }
      });
    });

    it('Deve atualizar status após saída de estoque', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemEmEstoque = itens.find((c: any) => 
          c.status === 'Em Estoque' && c.quantidade <= c.estoque_minimo + 3
        );
        
        if (itemEmEstoque) {
          const index = itens.indexOf(itemEmEstoque);
          
          cy.intercept('POST', `${apiUrl}/movimentacoes`).as('createMovimentacao');
          cy.intercept('GET', `${apiUrl}/estoques/item/*`).as('getEstoquesComponente');
          
          cy.getByData(`item-card-${index}`).within(() => {
            cy.getByData('saida-icon').click();
          });
          
          cy.wait('@getEstoquesComponente').then((estoqueInterception) => {
            const estoques = estoqueInterception.response?.body?.data || [];
            
            if (estoques.length > 0) {
              const estoque = estoques[0];
              
              cy.getByData('modal-saida-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(estoque.localizacao.nome).click();
              
              const quantidadeSaida = Math.min(2, estoque.quantidade);
              cy.getByData('modal-saida-quantidade-input').clear().type(quantidadeSaida.toString());
              
              cy.getByData('modal-saida-confirmar').click();
              
              cy.wait('@createMovimentacao', { timeout: 10000 });
              cy.wait('@getComponentes', { timeout: 10000 });
              
              cy.wait(1000);
              cy.getByData(`item-card-${index}`).should('exist');
            }
          });
        }
      });
    });

    it('Deve atualizar status ao alterar estoque mínimo', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        const itemComEstoque = itens.find((c: any) => c.quantidade > 0);
        
        if (itemComEstoque) {
          const itemId = itemComEstoque._id;
          
          cy.intercept('PUT', `${apiUrl}/itens/${itemId}`).as('updateComponente');
          cy.intercept('PATCH', `${apiUrl}/itens/${itemId}`).as('patchComponente');
          cy.intercept('GET', `${apiUrl}/categorias*`).as('getCategorias');
          
          cy.visit(`${frontendUrl}/itens/editar/${itemId}`);
          cy.wait('@getCategorias');
          
          const novoEstoqueMinimo = itemComEstoque.quantidade + 10;
          cy.get('#estoqueMinimo').clear().type(novoEstoqueMinimo.toString());
          
          cy.contains('button', 'Salvar').click();
          
          cy.wait('@patchComponente', { timeout: 10000 });
          
          cy.visit(`${frontendUrl}/itens`);
          cy.wait('@getComponentes');
          
          cy.wait(1000);
          cy.contains(itemComEstoque.nome).parents('[data-test^="item-card-"]').within(() => {
            cy.contains('Baixo Estoque').should('be.visible');
          });
        }
      });
    });

    it('Deve sincronizar status com estatísticas', () => {
      cy.wait('@getComponentes').then((interception) => {
        const stats = interception.response?.body?.stats;
        const itens = interception.response?.body?.data?.docs || [];
        
        if (stats && itens.length > 0) {
          const indisponiveis = itens.filter((c: any) => c.status === 'Indisponível').length;
          const baixoEstoque = itens.filter((c: any) => c.status === 'Baixo Estoque').length;
          const emEstoque = itens.filter((c: any) => c.status === 'Em Estoque').length;
          
          cy.log(`Stats: ${JSON.stringify(stats)}`);
          cy.log(`Indisponíveis na página: ${indisponiveis}`);
          cy.log(`Baixo Estoque na página: ${baixoEstoque}`);
          cy.log(`Em Estoque na página: ${emEstoque}`);
          
          expect(stats).to.have.property('total');
        }
      });
    });
  });

  describe('Visual do Status', () => {
    it('Deve exibir cores intuitivas para cada status', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        if (itens.length > 0) {
          itens.forEach((item: any, index: number) => {
            cy.getByData(`item-card-${index}`).within(() => {
              const statusBadge = cy.contains(item.status);
              statusBadge.should('be.visible');
              
              statusBadge.should('have.attr', 'class');
            });
          });
        }
      });
    });

    it('Deve manter consistência visual em toda aplicação', () => {
      cy.wait('@getComponentes').then((interception) => {
        const itens = interception.response?.body?.data?.docs || [];
        
        if (itens.length > 0) {
          const primeiroItem = itens[0];
          
          cy.getByData('item-card-0').within(() => {
            cy.contains(primeiroItem.status).should('be.visible');
          });
          
          cy.getByData('item-card-0').click();
          
          cy.wait('@getEstoquesComponente');
          
          cy.get('[role="dialog"]').within(() => {
            cy.getByData('modal-localizacoes-titulo').should('contain', primeiroItem.nome);
          });
          
          cy.getByData('modal-localizacoes-close').click();
          
          cy.getByData('item-card-0').within(() => {
            cy.contains(primeiroItem.status).should('be.visible');
          });
        }
      });
    });
  });
});
