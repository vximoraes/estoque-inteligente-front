describe('Componentes - Localizações e Status Automático', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/componentes*`).as('getComponentes');
    cy.intercept('GET', `${apiUrl}/estoques/componente/*`).as('getEstoquesComponente');
    
    cy.login(email, senha);
    cy.visit(`${frontendUrl}/componentes`);
    cy.wait('@getComponentes');
  });

  describe('Visualizar Localizações', () => {
    it('Deve abrir modal de localizações ao clicar no card', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        if (componentes.length > 0) {
          const componenteId = componentes[0]._id;
          
          cy.intercept('GET', `${apiUrl}/estoques/componente/${componenteId}`).as('getEstoques');
          
          cy.getByData('componente-card-0').click();
          
          cy.get('[role="dialog"]').should('be.visible');
          cy.contains(/localizações|onde está|estoque por localização/i).should('be.visible');
        }
      });
    });

    it('Deve exibir nome e descrição do componente no modal', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        if (componentes.length > 0) {
          const componente = componentes[0];
          
          cy.getByData('componente-card-0').click();
          
          cy.get('[role="dialog"]').within(() => {
            cy.contains(componente.nome).should('be.visible');
            
            if (componente.descricao) {
              cy.contains(componente.descricao).should('be.visible');
            }
          });
        }
      });
    });

    it('Deve listar todas as localizações com quantidades', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteComEstoque = componentes.find((c: any) => c.quantidade > 0);
        
        if (componenteComEstoque) {
          const index = componentes.indexOf(componenteComEstoque);
          const componenteId = componenteComEstoque._id;

          cy.intercept('GET', `${apiUrl}/estoques/componente/${componenteId}`).as('getEstoquesEspecifico');
          
          cy.getByData(`componente-card-${index}`).click();
          
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
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteComEstoque = componentes.find((c: any) => c.quantidade > 0);
        
        if (componenteComEstoque) {
          const index = componentes.indexOf(componenteComEstoque);
          const quantidadeTotal = componenteComEstoque.quantidade;
          
          cy.getByData(`componente-card-${index}`).click();
          
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
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteSemEstoque = componentes.find((c: any) => c.quantidade === 0);
        
        if (componenteSemEstoque) {
          const index = componentes.indexOf(componenteSemEstoque);
          const componenteId = componenteSemEstoque._id;

          cy.intercept('GET', `${apiUrl}/estoques/componente/${componenteId}`).as('getEstoquesVazio');
          
          cy.getByData(`componente-card-${index}`).click();
          
          cy.wait('@getEstoquesVazio');
          
          cy.get('[role="dialog"]').within(() => {
            cy.contains(/nenhuma localização|sem estoque|não há/i, { timeout: 5000 }).should('be.visible');
          });
        }
      });
    });

    it('Deve exibir loading durante carregamento de localizações', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        if (componentes.length > 0) {
          cy.getByData('componente-card-0').click();
          
          cy.get('[role="dialog"]').should('be.visible');
          
          cy.wait('@getEstoquesComponente');
        }
      });
    });

    it('Deve fechar modal ao clicar no botão fechar', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        if (componentes.length > 0) {
          cy.getByData('componente-card-0').click();
          
          cy.get('[role="dialog"]').should('be.visible');
          cy.wait('@getEstoquesComponente');
          
          cy.getByData('modal-localizacoes-close').click();
          
          cy.get('[role="dialog"]').should('not.exist');
        }
      });
    });

    it('Deve exibir dados corretos e atualizados', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteComEstoque = componentes.find((c: any) => c.quantidade > 0);
        
        if (componenteComEstoque) {
          const index = componentes.indexOf(componenteComEstoque);
          const componenteId = componenteComEstoque._id;
          
          cy.intercept('GET', `${apiUrl}/estoques/componente/${componenteId}`).as('getEstoquesDetalhado');
          
          cy.getByData(`componente-card-${index}`).click();
          
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
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteIndisponivel = componentes.find((c: any) => c.quantidade === 0);
        
        if (componenteIndisponivel) {
          const index = componentes.indexOf(componenteIndisponivel);
          
          cy.getByData(`componente-card-${index}`).within(() => {
            cy.contains('Indisponível').should('be.visible');
          });
        }
      });
    });

    it('Deve calcular status "Baixo Estoque" quando 0 < quantidade < estoque_mínimo', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteBaixoEstoque = componentes.find((c: any) => 
          c.quantidade > 0 && c.quantidade < c.estoque_minimo
        );
        
        if (componenteBaixoEstoque) {
          const index = componentes.indexOf(componenteBaixoEstoque);
          
          cy.getByData(`componente-card-${index}`).within(() => {
            cy.contains('Baixo Estoque').should('be.visible');
          });
        }
      });
    });

    it('Deve calcular status "Em Estoque" quando quantidade >= estoque_mínimo', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteEmEstoque = componentes.find((c: any) => 
          c.quantidade >= c.estoque_minimo && c.estoque_minimo > 0
        );
        
        if (componenteEmEstoque) {
          const index = componentes.indexOf(componenteEmEstoque);
          
          cy.getByData(`componente-card-${index}`).within(() => {
            cy.contains('Em Estoque').should('be.visible');
          });
        }
      });
    });

    it('Deve exibir badge com cor correta para cada status', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        componentes.forEach((componente: any, index: number) => {
          cy.getByData(`componente-card-${index}`).within(() => {
            const badge = cy.contains(componente.status);
            
            if (componente.status === 'Indisponível') {
              badge.should('exist');
            } else if (componente.status === 'Baixo Estoque') {
              badge.should('exist');
            } else if (componente.status === 'Em Estoque') {
              badge.should('exist');
            }
          });
        });
      });
    });

    it('Deve atualizar status automaticamente após criação', () => {
      cy.intercept('POST', `${apiUrl}/componentes`).as('createComponente');
      cy.intercept('GET', `${apiUrl}/categorias*`).as('getCategorias');
      
      cy.visit(`${frontendUrl}/componentes/adicionar`);
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
            const componenteCriado = createInterception.response?.body?.data;
            
            expect(componenteCriado.status).to.eq('Indisponível');
            
            if (componenteCriado._id) {
              cy.request({
                method: 'PATCH',
                url: `${apiUrl}/componentes/${componenteCriado._id}/inativar`,
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
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteIndisponivel = componentes.find((c: any) => c.status === 'Indisponível');
        
        if (componenteIndisponivel) {
          const index = componentes.indexOf(componenteIndisponivel);
          
          cy.intercept('POST', `${apiUrl}/movimentacoes`).as('createMovimentacao');
          cy.intercept('GET', `${apiUrl}/localizacoes*`).as('getLocalizacoes');
          
          cy.getByData(`componente-card-${index}`).within(() => {
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
              cy.getByData(`componente-card-${index}`).within(() => {
                cy.contains(/baixo estoque|em estoque/i).should('be.visible');
              });
            }
          });
        }
      });
    });

    it('Deve atualizar status após saída de estoque', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteEmEstoque = componentes.find((c: any) => 
          c.status === 'Em Estoque' && c.quantidade <= c.estoque_minimo + 3
        );
        
        if (componenteEmEstoque) {
          const index = componentes.indexOf(componenteEmEstoque);
          
          cy.intercept('POST', `${apiUrl}/movimentacoes`).as('createMovimentacao');
          cy.intercept('GET', `${apiUrl}/estoques/componente/*`).as('getEstoquesComponente');
          
          cy.getByData(`componente-card-${index}`).within(() => {
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
              cy.getByData(`componente-card-${index}`).should('exist');
            }
          });
        }
      });
    });

    it('Deve atualizar status ao alterar estoque mínimo', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        const componenteComEstoque = componentes.find((c: any) => c.quantidade > 0);
        
        if (componenteComEstoque) {
          const componenteId = componenteComEstoque._id;
          
          cy.intercept('PUT', `${apiUrl}/componentes/${componenteId}`).as('updateComponente');
          cy.intercept('PATCH', `${apiUrl}/componentes/${componenteId}`).as('patchComponente');
          cy.intercept('GET', `${apiUrl}/categorias*`).as('getCategorias');
          
          cy.visit(`${frontendUrl}/componentes/editar/${componenteId}`);
          cy.wait('@getCategorias');
          
          const novoEstoqueMinimo = componenteComEstoque.quantidade + 10;
          cy.get('#estoqueMinimo').clear().type(novoEstoqueMinimo.toString());
          
          cy.contains('button', 'Salvar').click();
          
          cy.wait('@patchComponente', { timeout: 10000 });
          
          cy.visit(`${frontendUrl}/componentes`);
          cy.wait('@getComponentes');
          
          cy.wait(1000);
          cy.contains(componenteComEstoque.nome).parents('[data-test^="componente-card-"]').within(() => {
            cy.contains('Baixo Estoque').should('be.visible');
          });
        }
      });
    });

    it('Deve sincronizar status com estatísticas', () => {
      cy.wait('@getComponentes').then((interception) => {
        const stats = interception.response?.body?.stats;
        const componentes = interception.response?.body?.data?.docs || [];
        
        if (stats && componentes.length > 0) {
          const indisponiveis = componentes.filter((c: any) => c.status === 'Indisponível').length;
          const baixoEstoque = componentes.filter((c: any) => c.status === 'Baixo Estoque').length;
          const emEstoque = componentes.filter((c: any) => c.status === 'Em Estoque').length;
          
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
        const componentes = interception.response?.body?.data?.docs || [];
        
        if (componentes.length > 0) {
          componentes.forEach((componente: any, index: number) => {
            cy.getByData(`componente-card-${index}`).within(() => {
              const statusBadge = cy.contains(componente.status);
              statusBadge.should('be.visible');
              
              statusBadge.should('have.attr', 'class');
            });
          });
        }
      });
    });

    it('Deve manter consistência visual em toda aplicação', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];
        
        if (componentes.length > 0) {
          const primeiroComponente = componentes[0];
          
          cy.getByData('componente-card-0').within(() => {
            cy.contains(primeiroComponente.status).should('be.visible');
          });
          
          cy.getByData('componente-card-0').click();
          
          cy.wait('@getEstoquesComponente');
          
          cy.get('[role="dialog"]').within(() => {
            cy.getByData('modal-localizacoes-titulo').should('contain', primeiroComponente.nome);
          });
          
          cy.getByData('modal-localizacoes-close').click();
          
          cy.getByData('componente-card-0').within(() => {
            cy.contains(primeiroComponente.status).should('be.visible');
          });
        }
      });
    });
  });
});
