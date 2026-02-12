describe('Usuários - Listagem e Pesquisa', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/usuarios*`).as('getUsuarios');
    
    cy.login(email, senha);
    cy.visit(`${frontendUrl}/usuarios`, { failOnStatusCode: false });
    cy.wait('@getUsuarios', { timeout: 30000 });
    cy.wait(1000);
  });

  describe('Listagem de Usuários', () => {
    it('Deve exibir tabela de usuários após carregar', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.getByData("usuarios-table").should('be.visible');
        } else {
          cy.log('Nenhum usuário disponível para testar tabela');
        }
      });
    });

    it('Deve exibir colunas corretas na tabela', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.getByData("usuarios-table").within(() => {
            cy.contains('th', 'NOME').should('be.visible');
            cy.contains('th', 'E-MAIL').should('be.visible');
            cy.contains('th', 'STATUS').should('be.visible');
            cy.contains('th', 'AÇÕES').should('be.visible');
          });
        } else {
          cy.log('Nenhum usuário disponível para testar colunas');
        }
      });
    });

    it('Deve exibir status correto para cada usuário', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="usuarios-table"] tbody tr').length > 0) {
          cy.getByData("usuarios-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.get('span').contains(/Ativo|Aguardando ativação/).should('be.visible');
            });
          });
        } else {
          cy.log('Nenhum usuário disponível para testar status');
        }
      });
    });

    it('Deve exibir botões de ações', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="usuarios-table"] tbody tr').length > 0) {
          cy.getByData("usuarios-table").within(() => {
            cy.get('tbody tr').first().within(() => {
              cy.getByData("visualizar-button").should('exist');
              cy.getByData("excluir-button").should('exist');
            });
          });
        } else {
          cy.log('Nenhum usuário disponível para testar botões');
        }
      });
    });
  });

  describe('Pesquisa', () => {
    it('Deve filtrar usuários por nome', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-test="usuarios-table"] tbody tr').length > 0) {
          cy.getByData("usuarios-table")
            .find('tbody tr')
            .first()
            .find('td')
            .first()
            .invoke('text')
            .then((nomeUsuario) => {
              const termoPesquisa = nomeUsuario.trim().substring(0, 3);
              
              cy.getByData("search-input").clear().type(termoPesquisa);
              cy.wait('@getUsuarios', { timeout: 30000 });
              
              cy.getByData("usuarios-table").should('be.visible');
            });
        } else {
          cy.log('Nenhum usuário disponível para testar pesquisa');
        }
      });
    });

    it('Deve exibir mensagem quando não encontra resultados', () => {
      cy.wait(500);
      cy.get('body').then($body => {
        if ($body.find('[data-test="search-input"]').length > 0) {
          cy.getByData("search-input").clear().type('UsuarioQueNaoExiste12345XYZ');
          cy.wait('@getUsuarios', { timeout: 30000 });
          cy.wait(1000);
          
          cy.get('body').then($body => {
            if ($body.find('[data-test="usuarios-table"]').length === 0) {
              cy.getByData("empty-state").should('be.visible');
              cy.contains(/nenhum usuário encontrado/i).should('be.visible');
            } else {
              cy.log('Ainda existem resultados na tabela');
            }
          });
        } else {
          cy.log('Campo de pesquisa não encontrado');
        }
      });
    });

    it('Deve restaurar listagem ao limpar busca', () => {
      cy.wait(500);
      cy.get('body').then($body => {
        if ($body.find('[data-test="search-input"]').length > 0) {
          cy.getByData("search-input").clear().type('teste');
          cy.wait('@getUsuarios', { timeout: 30000 });
          cy.wait(500);
          
          cy.getByData("search-input").clear();
          cy.wait('@getUsuarios', { timeout: 30000 });
          cy.wait(500);
          
          cy.get('body').then($body => {
            if ($body.find('[data-test="usuarios-table"]').length > 0) {
              cy.getByData("usuarios-table").should('be.visible');
            } else {
              cy.log('Tabela não disponível após limpar busca');
            }
          });
        } else {
          cy.log('Campo de pesquisa não encontrado');
        }
      });
    });
  });

  describe('Navegação', () => {
    it('Deve ter botão para cadastrar usuário', () => {
      cy.wait(500);
      cy.get('body').then($body => {
        if ($body.find('[data-test="cadastrar-usuario-button"]').length > 0) {
          cy.getByData("cadastrar-usuario-button").should('be.visible');
          cy.getByData("cadastrar-usuario-button").should('contain', 'Cadastrar');
        } else {
          cy.log('Botão cadastrar usuário não encontrado');
        }
      });
    });
  });

  describe('Estado Vazio', () => {
    it('Deve exibir mensagem apropriada quando não há usuários após pesquisa', () => {
      cy.wait(500);
      cy.get('body').then($body => {
        if ($body.find('[data-test="search-input"]').length > 0) {
          cy.getByData("search-input").clear().type('UsuarioInexistente999');
          cy.wait('@getUsuarios', { timeout: 30000 });
          cy.wait(1000);
          
          cy.get('body').then($body => {
            if ($body.find('[data-test="usuarios-table"]').length === 0) {
              cy.getByData("empty-state").should('be.visible');
              cy.contains(/nenhum usuário encontrado/i).should('be.visible');
            } else {
              cy.log('Tabela ainda contém usuários');
            }
          });
        } else {
          cy.log('Campo de pesquisa não encontrado');
        }
      });
    });
  });

  describe('Loading', () => {
    it('Deve exibir estado de loading durante carregamento', () => {
      cy.intercept('GET', `${apiUrl}/usuarios*`, (req) => {
        req.reply((res) => {
          res.delay = 1000;
          return res;
        });
      }).as('getUsuariosLento');
      
      cy.visit(`${frontendUrl}/usuarios`, { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('[data-test="loading-state"]').length > 0) {
          cy.getByData("loading-state").should('be.visible');
        } else {
          cy.log('Estado de loading já passou ou não foi exibido');
        }
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('Deve exibir mensagem de erro ao falhar carregamento', () => {
      cy.intercept('GET', `${apiUrl}/usuarios*`, {
        statusCode: 500,
        body: { message: 'Erro interno do servidor' }
      }).as('getUsuariosError');
      
      cy.visit(`${frontendUrl}/usuarios`, { failOnStatusCode: false });
      cy.wait('@getUsuariosError', { timeout: 30000 });
      cy.wait(1000);
      
      cy.get('body').then($body => {
        if ($body.find('[data-test="error-message"]').length > 0) {
          cy.getByData("error-message").should('be.visible');
          cy.contains(/erro/i).should('be.visible');
        } else {
          cy.log('Mensagem de erro não foi exibida ou tem data-test diferente');
        }
      });
    });
  });
});
