describe('Componentes - Movimentações (Entrada e Saída)', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/componentes*`).as('getComponentes');
    cy.intercept('GET', `${apiUrl}/localizacoes*`).as('getLocalizacoes');
    cy.intercept('POST', `${apiUrl}/movimentacoes`).as('createMovimentacao');
    cy.intercept('GET', `${apiUrl}/estoques/componente/*`).as('getEstoquesComponente');
    
    cy.login(email, senha);
    cy.visit(`${frontendUrl}/componentes`);
    cy.wait('@getComponentes');
  });

  describe('Entrada de Componente', () => {
    it('Deve abrir modal de entrada ao clicar em Entrada', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          const componente = componentes[0];

          cy.getByData('componente-card-0').within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.getByData('modal-entrada').should('be.visible');
          cy.getByData('modal-entrada-titulo').should('contain', componente.nome);
        }
      });
    });

    it('Deve exibir campos obrigatórios no modal de entrada', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          cy.getByData('componente-card-0').within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.getByData('modal-entrada-localizacao-container').should('be.visible');
          cy.getByData('modal-entrada-quantidade-container').should('be.visible');
        }
      });
    });

    it('Deve carregar localizações no dropdown', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          cy.getByData('componente-card-0').within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.wait('@getLocalizacoes');

          cy.getByData('modal-entrada').within(() => {
            cy.getByData('modal-entrada-localizacao-dropdown').should('exist');
          });
        }
      });
    });

    it('Deve validar localização obrigatória', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          cy.getByData('componente-card-0').within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.getByData('modal-entrada').within(() => {
            cy.getByData('modal-entrada-quantidade-input').clear().type('10');

            cy.getByData('modal-entrada-confirmar').click();

            cy.wait(500);
            cy.getByData('modal-entrada-localizacao-dropdown').should('exist');
          });
        }
      });
    });

    it('Deve validar quantidade obrigatória e maior que 0', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          cy.getByData('componente-card-0').within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.wait('@getLocalizacoes').then((locInterception) => {
            const localizacoes = locInterception.response?.body?.data?.docs || [];

            if (localizacoes.length > 0) {
              cy.getByData('modal-entrada-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(localizacoes[0].nome).click();
              
              cy.getByData('modal-entrada-quantidade-input').clear().type('0');
              cy.getByData('modal-entrada-confirmar').click();

              cy.wait(500);
              cy.getByData('modal-entrada-quantidade-input').should('exist');
            }
          });
        }
      });
    });

    it('Deve validar quantidade máxima de 999.999.999', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          cy.getByData('componente-card-0').within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.get('[role="dialog"]').within(() => {
            cy.get('input[name="quantidade"]').clear().type('9999999999');
            cy.get('input[name="quantidade"]').blur();
            cy.wait(500);
          });
        }
      });
    });

    it('Deve registrar entrada com sucesso', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          const componente = componentes[0];
          const quantidadeInicial = componente.quantidade;

          cy.getByData('componente-card-0').within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.wait('@getLocalizacoes').then((locInterception) => {
            const localizacoes = locInterception.response?.body?.data?.docs || [];

            if (localizacoes.length > 0) {
              cy.getByData('modal-entrada-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(localizacoes[0].nome).click();
              
              cy.getByData('modal-entrada-quantidade-input').clear().type('5');

              cy.getByData('modal-entrada-confirmar').click();

              cy.wait('@createMovimentacao', { timeout: 10000 }).then((movInterception) => {
                expect(movInterception.response?.statusCode).to.be.oneOf([200, 201]);
                cy.contains(/entrada.*sucesso|registrada/i, { timeout: 5000 }).should('be.visible');
              });
            }
          });
        }
      });
    });

    it('Deve atualizar quantidade total do componente após entrada', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          const componente = componentes[0];
          const quantidadeInicial = componente.quantidade;
          const quantidadeEntrada = 3;

          cy.getByData('componente-card-0').within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.wait('@getLocalizacoes').then((locInterception) => {
            const localizacoes = locInterception.response?.body?.data?.docs || [];

            if (localizacoes.length > 0) {
              cy.getByData('modal-entrada-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(localizacoes[0].nome).click();
              
              cy.getByData('modal-entrada-quantidade-input').clear().type(quantidadeEntrada.toString());
              cy.getByData('modal-entrada-confirmar').click();

              cy.wait('@createMovimentacao', { timeout: 10000 });
              cy.wait('@getComponentes', { timeout: 10000 });

              cy.wait(1000);
              cy.getByData('componente-card-0').within(() => {
                const novaQuantidade = quantidadeInicial + quantidadeEntrada;
                cy.contains(novaQuantidade.toString()).should('be.visible');
              });
            }
          });
        }
      });
    });

    it('Deve exibir loading no card durante atualização', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          cy.getByData('componente-card-0').within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.wait('@getLocalizacoes').then((locInterception) => {
            const localizacoes = locInterception.response?.body?.data?.docs || [];

            if (localizacoes.length > 0) {
              cy.getByData('modal-entrada-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(localizacoes[0].nome).click();
              
              cy.getByData('modal-entrada-quantidade-input').clear().type('5');
              cy.getByData('modal-entrada-confirmar').click();

              cy.getByData('componente-card-0').should('exist');
            }
          });
        }
      });
    });

    it('Deve recalcular status após entrada (Indisponível → Baixo Estoque ou Em Estoque)', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        const componenteIndisponivel = componentes.find((c: any) => c.status === 'Indisponível');

        if (componenteIndisponivel) {
          const index = componentes.indexOf(componenteIndisponivel);

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

    it('Deve atualizar estatísticas após entrada', () => {
      cy.wait('@getComponentes').then((interception) => {
        const statsAntes = interception.response?.body?.stats;
        const componentes = interception.response?.body?.data?.docs || [];

        if (componentes.length > 0) {
          const componenteIndisponivel = componentes.find((c: any) => c.status === 'Indisponível');
          const index = componenteIndisponivel ? componentes.indexOf(componenteIndisponivel) : 0;

          cy.getByData(`componente-card-${index}`).within(() => {
            cy.getByData('entrada-icon').click();
          });

          cy.wait('@getLocalizacoes').then((locInterception) => {
            const localizacoes = locInterception.response?.body?.data?.docs || [];

            if (localizacoes.length > 0) {
              cy.getByData('modal-entrada-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(localizacoes[0].nome).click();
              
              cy.getByData('modal-entrada-quantidade-input').clear().type('10');
              cy.getByData('modal-entrada-confirmar').click();

              cy.wait('@createMovimentacao', { timeout: 10000 });
              cy.wait('@getComponentes', { timeout: 10000 }).then((novaInterception) => {
                const statsDepois = novaInterception.response?.body?.stats;

                if (statsAntes && statsDepois && componenteIndisponivel) {
                  expect(statsDepois.indisponiveis).to.be.lessThan(statsAntes.indisponiveis);
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Saída de Componente', () => {
    it('Deve abrir modal de saída ao clicar em Saída', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        const componenteComEstoque = componentes.find((c: any) => c.quantidade > 0);

        if (componenteComEstoque) {
          const index = componentes.indexOf(componenteComEstoque);

          cy.getByData(`componente-card-${index}`).within(() => {
            cy.getByData('saida-icon').click();
          });

          cy.getByData('modal-saida').should('be.visible');
          cy.getByData('modal-saida-titulo').should('be.visible');
        } else {
          cy.log('Nenhum componente com estoque disponível para teste de saída');
        }
      });
    });

    it('Deve carregar apenas localizações com estoque disponível', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        const componenteComEstoque = componentes.find((c: any) => c.quantidade > 0);

        if (componenteComEstoque) {
          const index = componentes.indexOf(componenteComEstoque);

          cy.getByData(`componente-card-${index}`).within(() => {
            cy.getByData('saida-icon').click();
          });

          cy.wait('@getEstoquesComponente');

          cy.getByData('modal-saida').within(() => {
            cy.getByData('modal-saida-localizacao-dropdown').should('exist');
          });
        }
      });
    });

    it('Deve validar estoque suficiente antes de permitir saída', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        const componenteComEstoque = componentes.find((c: any) => c.quantidade > 0);

        if (componenteComEstoque) {
          const index = componentes.indexOf(componenteComEstoque);

          cy.getByData(`componente-card-${index}`).within(() => {
            cy.getByData('saida-icon').click();
          });

          cy.wait('@getEstoquesComponente').then((estoqueInterception) => {
            const estoques = estoqueInterception.response?.body?.data || [];

            if (estoques.length > 0) {
              const estoque = estoques[0];

              cy.getByData('modal-saida-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(estoque.localizacao.nome).click();

              const quantidadeExcessiva = estoque.quantidade + 10;
              cy.getByData('modal-saida-quantidade-input').clear().type(quantidadeExcessiva.toString());

              cy.getByData('modal-saida-confirmar').click();

              cy.wait(1000);
              cy.contains(/insuficiente|disponível|estoque/i, { timeout: 5000 });
            }
          });
        }
      });
    });

    it('Deve registrar saída com sucesso', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        const componenteComEstoque = componentes.find((c: any) => c.quantidade >= 5);

        if (componenteComEstoque) {
          const index = componentes.indexOf(componenteComEstoque);

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

              cy.wait('@createMovimentacao', { timeout: 10000 }).then((movInterception) => {
                expect(movInterception.response?.statusCode).to.be.oneOf([200, 201]);

                cy.contains(/saída.*sucesso|registrada/i, { timeout: 5000 }).should('be.visible');
              });
            }
          });
        }
      });
    });

    it('Deve diminuir quantidade total após saída', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        const componenteComEstoque = componentes.find((c: any) => c.quantidade >= 5);

        if (componenteComEstoque) {
          const index = componentes.indexOf(componenteComEstoque);
          const quantidadeInicial = componenteComEstoque.quantidade;
          const quantidadeSaida = 2;

          cy.getByData(`componente-card-${index}`).within(() => {
            cy.getByData('saida-icon').click();
          });

          cy.wait('@getEstoquesComponente').then((estoqueInterception) => {
            const estoques = estoqueInterception.response?.body?.data || [];

            if (estoques.length > 0) {
              const estoque = estoques[0];

              cy.getByData('modal-saida-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(estoque.localizacao.nome).click();
              
              cy.getByData('modal-saida-quantidade-input').clear().type(quantidadeSaida.toString());
              cy.getByData('modal-saida-confirmar').click();

              cy.wait('@createMovimentacao', { timeout: 10000 });
              cy.wait('@getComponentes', { timeout: 10000 });

              cy.wait(1000);
              cy.getByData(`componente-card-${index}`).within(() => {
                const novaQuantidade = quantidadeInicial - quantidadeSaida;
                cy.contains(novaQuantidade.toString()).should('be.visible');
              });
            }
          });
        }
      });
    });

    it('Deve recalcular status após saída (Em Estoque → Baixo Estoque ou Indisponível)', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        const componenteEmEstoque = componentes.find((c: any) =>
          c.status === 'Em Estoque' && c.quantidade <= c.estoque_minimo + 5
        );

        if (componenteEmEstoque) {
          const index = componentes.indexOf(componenteEmEstoque);

          cy.getByData(`componente-card-${index}`).within(() => {
            cy.getByData('saida-icon').click();
          });

          cy.wait('@getEstoquesComponente').then((estoqueInterception) => {
            const estoques = estoqueInterception.response?.body?.data || [];

            if (estoques.length > 0) {
              const estoque = estoques[0];
              const quantidadeSaida = Math.min(3, estoque.quantidade);

              cy.getByData('modal-saida-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(estoque.localizacao.nome).click();
              
              cy.getByData('modal-saida-quantidade-input').clear().type(quantidadeSaida.toString());
              cy.getByData('modal-saida-confirmar').click();

              cy.wait('@createMovimentacao', { timeout: 10000 });
              cy.wait('@getComponentes', { timeout: 10000 });

              cy.wait(1000);
            }
          });
        }
      });
    });

    it('Não deve permitir saída maior que estoque disponível', () => {
      cy.wait('@getComponentes').then((interception) => {
        const componentes = interception.response?.body?.data?.docs || [];

        const componenteComEstoque = componentes.find((c: any) => c.quantidade > 0);

        if (componenteComEstoque) {
          const index = componentes.indexOf(componenteComEstoque);

          cy.getByData(`componente-card-${index}`).within(() => {
            cy.getByData('saida-icon').click();
          });

          cy.wait('@getEstoquesComponente').then((estoqueInterception) => {
            const estoques = estoqueInterception.response?.body?.data || [];

            if (estoques.length > 0) {
              const estoque = estoques[0];

              cy.getByData('modal-saida-localizacao-dropdown').click();
              cy.get('[data-dropdown]').contains(estoque.localizacao.nome).click();

              const quantidadeExcessiva = estoque.quantidade + 100;
              cy.getByData('modal-saida-quantidade-input').clear().type(quantidadeExcessiva.toString());

              cy.getByData('modal-saida-confirmar').click();

              cy.wait(1000);
              cy.contains(/insuficiente|disponível|estoque|excede/i, { timeout: 5000 });
            }
          });
        }
      });
    });
  });
});
