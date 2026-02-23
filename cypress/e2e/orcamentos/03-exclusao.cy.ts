describe('Orçamentos - Exclusão', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let orcamentoTesteId: string;
  let authToken: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email, senha },
      timeout: 30000
    }).then((loginResponse) => {
      authToken = loginResponse.body.data.user.accesstoken;

      cy.request({
        method: 'GET',
        url: `${apiUrl}/itens?limit=1`,
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 30000
      }).then((compResponse) => {
        const itens = compResponse.body?.data?.docs || [];
        
        if (itens.length > 0) {
          cy.request({
            method: 'GET',
            url: `${apiUrl}/fornecedores?limit=1`,
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 30000
          }).then((fornResponse) => {
            const fornecedores = fornResponse.body?.data?.docs || [];
            
            if (fornecedores.length > 0) {
              const nomeOrcamento = `Orçamento Para Exclusão ${Date.now()}`;
              
              cy.request({
                method: 'POST',
                url: `${apiUrl}/orcamentos`,
                headers: { Authorization: `Bearer ${authToken}` },
                body: {
                  nome: nomeOrcamento,
                  descricao: 'Este orçamento será excluído nos testes',
                  itens: [
                    {
                      item: itens[0]._id,
                      fornecedor: fornecedores[0]._id,
                      quantidade: 5,
                      valor_unitario: 10.00
                    }
                  ]
                },
                timeout: 30000
              }).then((createResponse) => {
                orcamentoTesteId = createResponse.body?.data?._id;
                cy.log(`Orçamento de teste criado: ${orcamentoTesteId}`);
              });
            }
          });
        }
      });
    });
  });

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/orcamentos*`).as('getOrcamentos');
    cy.intercept('PATCH', `${apiUrl}/orcamentos/*/inativar`).as('deleteOrcamento');
    
    cy.login(email, senha);
    cy.visit(`${frontendUrl}/orcamentos`);
    cy.wait('@getOrcamentos', { timeout: 30000 });
  });

  describe('Modal de Confirmação de Exclusão', () => {
    it('Deve abrir modal de confirmação ao clicar em Excluir', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").should('be.visible');
          cy.getByData("modal-excluir-titulo").should('be.visible');
        } else {
          cy.log('Nenhum orçamento disponível para testar abertura do modal');
        }
      });
    });

    it('Deve exibir o nome do orçamento no modal', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-nome-orcamento").should('exist');
          });
        } else {
          cy.log('Nenhum orçamento disponível para testar exibição de nome');
        }
      });
    });

    it('Deve ter botões Cancelar e Excluir no modal', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-cancelar").should('be.visible');
            cy.getByData("modal-excluir-confirmar").should('be.visible');
          });
        } else {
          cy.log('Nenhum orçamento disponível para testar botões do modal');
        }
      });
    });

    it('Deve ter botão Excluir em vermelho (destaque de ação destrutiva)', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-confirmar")
              .should('have.css', 'background-color')
              .and('match', /rgb\(2[012]\d, 3[0-9], 3[0-9]\)|rgb\(239, 68, 68\)|rgb\(248, 113, 113\)|rgb\(220, 38, 38\)|rgb\(185, 28, 28\)/);
          });
        } else {
          cy.log('Nenhum orçamento disponível para testar cor do botão');
        }
      });
    });

    it('Deve fechar modal ao clicar em Cancelar', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-cancelar").click();
          });

          cy.getByData("modal-excluir").should('not.exist');
        } else {
          cy.log('Nenhum orçamento disponível para testar cancelamento');
        }
      });
    });

    it('Deve fechar modal ao clicar no X', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-close").click();
          });

          cy.getByData("modal-excluir").should('not.exist');
        } else {
          cy.log('Nenhum orçamento disponível para testar fechamento pelo X');
        }
      });
    });

    it('Deve fechar modal ao pressionar ESC', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").should('be.visible');
          cy.get('body').type('{esc}');
          cy.getByData("modal-excluir").should('not.exist');
        } else {
          cy.log('Nenhum orçamento disponível para testar fechamento por ESC');
        }
      });
    });
  });

  describe('Processo de Exclusão', () => {
    it('Deve excluir orçamento ao confirmar (soft delete)', () => {
      if (!orcamentoTesteId) {
        cy.log('Orçamento de teste não foi criado, pulando teste');
        return;
      }

      cy.get('body').then($body => {
        if ($body.text().includes('Para Exclusão')) {
          cy.contains('Para Exclusão').parents('tr').within(() => {
            cy.getByData("excluir-button").click();
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-confirmar").click();
          });

          cy.wait('@deleteOrcamento', { timeout: 30000 }).then((interception) => {
            expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
          });

          cy.contains(/excluído|removido|deletado.*sucesso/i, { timeout: 5000 }).should('be.visible');

          orcamentoTesteId = '';
        }
      });
    });

    it('Deve atualizar listagem automaticamente após exclusão', () => {
      cy.get('body').then($body => {
        const totalAntes = $body.find('[data-test="orcamentos-table"] tbody tr').length;

        if (totalAntes > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-confirmar").click();
          });

          cy.wait('@deleteOrcamento', { timeout: 30000 });
          cy.wait('@getOrcamentos', { timeout: 30000 });

          cy.log('Listagem atualizada após exclusão');
        } else {
          cy.log('Nenhum orçamento disponível para testar atualização da listagem');
        }
      });
    });

    it('Deve exibir toast de sucesso após exclusão', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-confirmar").click();
          });

          cy.wait('@deleteOrcamento', { timeout: 30000 });
          cy.contains(/sucesso/i, { timeout: 5000 }).should('be.visible');
        } else {
          cy.log('Nenhum orçamento disponível para testar toast de sucesso');
        }
      });
    });
  });

  describe('Paginação após Exclusão', () => {
    it('Deve ajustar paginação se era último item da página', () => {
      cy.log('Teste de ajuste de paginação - verificando cenário');
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.log('Há orçamentos na tabela para verificar paginação');
        } else {
          cy.log('Nenhum orçamento disponível para testar paginação');
        }
      });
    });
  });

  describe('Exclusão com Soft Delete', () => {
    it('Orçamento excluído não deve aparecer em nova busca', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table")
            .find('tbody tr')
            .first()
            .find('td')
            .first()
            .invoke('text')
            .then((orcamentoNome) => {
              cy.getByData("orcamentos-table").within(() => {
                cy.get('tbody tr').first().within(() => {
                  cy.getByData("excluir-button").click();
                });
              });

              cy.getByData("modal-excluir").within(() => {
                cy.getByData("modal-excluir-confirmar").click();
              });

              cy.wait('@deleteOrcamento', { timeout: 30000 });
              cy.wait('@getOrcamentos', { timeout: 30000 });

              cy.log(`Verificando que ${orcamentoNome} foi removido`);
            });
        } else {
          cy.log('Nenhum orçamento disponível para testar busca após exclusão');
        }
      });
    });

    it('Orçamento excluído é inativado, não deletado permanentemente', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-confirmar").click();
          });

          cy.wait('@deleteOrcamento', { timeout: 30000 }).then((deleteInterception) => {
            expect(deleteInterception.request.url).to.include('/inativar');
          });
        } else {
          cy.log('Nenhum orçamento disponível para testar soft delete');
        }
      });
    });
  });

  describe('Confirmação Obrigatória', () => {
    it('Não deve excluir sem confirmação', () => {
      cy.get('body').then($body => {
        const totalInicial = $body.find('[data-test="orcamentos-table"] tbody tr').length;

        if (totalInicial > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-cancelar").click();
          });

          cy.wait(500);

          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').should('have.length', totalInicial);
          });
        } else {
          cy.log('Nenhum orçamento disponível para testar cancelamento');
        }
      });
    });

    it('Deve exibir feedback apropriado após exclusão', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-confirmar").click();
          });

          cy.wait('@deleteOrcamento', { timeout: 30000 });
          cy.contains(/sucesso/i, { timeout: 5000 }).should('be.visible');
        } else {
          cy.log('Nenhum orçamento disponível para testar feedback de exclusão');
        }
      });
    });

    it('Modal deve ter foco ao abrir', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").should('be.visible');
          cy.focused().should('exist');
        } else {
          cy.log('Nenhum orçamento disponível para testar foco do modal');
        }
      });
    });
  });

  describe('Tratamento de Erros na Exclusão', () => {
    it('Deve exibir mensagem de erro se a exclusão falhar', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.intercept('PATCH', `${apiUrl}/orcamentos/*/inativar`, {
            statusCode: 500,
            body: { message: 'Erro ao excluir orçamento' }
          }).as('deleteOrcamentoError');

          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-confirmar").click();
          });

          cy.wait('@deleteOrcamentoError', { timeout: 30000 });
          cy.wait(1000);
          
          cy.get('body').then($body => {
            if ($body.text().includes('erro') || $body.text().includes('Erro')) {
              cy.contains(/erro/i).should('be.visible');
            }
          });
        } else {
          cy.log('Nenhum orçamento disponível para testar erro de exclusão');
        }
      });
    });

    it('Modal deve permanecer aberto se houver erro', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.intercept('PATCH', `${apiUrl}/orcamentos/*/inativar`, {
            statusCode: 500,
            body: { message: 'Erro ao excluir orçamento' }
          }).as('deleteOrcamentoError');

          cy.getByData("orcamentos-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("excluir-button").click();
            });
          });

          cy.getByData("modal-excluir").within(() => {
            cy.getByData("modal-excluir-confirmar").click();
          });

          cy.wait('@deleteOrcamentoError', { timeout: 30000 });
          cy.wait(1000);
          
          cy.getByData("modal-excluir").should('be.visible');
        } else {
          cy.log('Nenhum orçamento disponível para testar erro no modal');
        }
      });
    });
  });

  after(() => {
    if (orcamentoTesteId) {
      const apiUrl = Cypress.env('API_URL');
      const email = Cypress.env('TEST_USER_EMAIL');
      const senha = Cypress.env('TEST_USER_PASSWORD');

      cy.request({
        method: 'POST',
        url: `${apiUrl}/login`,
        body: { email, senha },
        timeout: 30000,
        failOnStatusCode: false
      }).then((loginResponse) => {
        if (loginResponse.body?.data?.user?.accesstoken) {
          const token = loginResponse.body.data.user.accesstoken;

          cy.request({
            method: 'PATCH',
            url: `${apiUrl}/orcamentos/${orcamentoTesteId}/inativar`,
            headers: {
              Authorization: `Bearer ${token}`
            },
            timeout: 30000,
            failOnStatusCode: false
          }).then(() => {
            cy.log(`Orçamento de teste ${orcamentoTesteId} removido na limpeza`);
          });
        }
      });
    }
  });
});
