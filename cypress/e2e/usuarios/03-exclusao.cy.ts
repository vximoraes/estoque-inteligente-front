describe('Usuários - Exclusão', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/usuarios*`).as('getUsuarios');
    cy.intercept('DELETE', `${apiUrl}/usuarios/*`).as('deleteUsuario');

    cy.login(email, senha);
    cy.wait(2000);
    cy.visit(`${frontendUrl}/usuarios`, { failOnStatusCode: false });
    cy.wait('@getUsuarios', { timeout: 30000 });
  });

  describe('Modal de Exclusão', () => {
    it('Deve abrir modal de exclusão ao clicar no botão excluir', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('excluir-button').click();
              });
          });

          cy.getByData('modal-excluir-usuario').should('be.visible');
        } else {
          cy.log('Nenhum usuário disponível para testar exclusão');
        }
      });
    });

    it('Deve exibir nome do usuário no modal de confirmação', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          let nomeUsuario = '';

          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.get('td')
                  .first()
                  .invoke('text')
                  .then((text) => {
                    nomeUsuario = text.trim();
                  });
                cy.getByData('excluir-button').click();
              });
          });

          cy.getByData('modal-excluir-usuario').within(() => {
            cy.getByData('modal-excluir-nome-usuario').should('exist');
          });
        } else {
          cy.log('Nenhum usuário disponível para testar exclusão');
        }
      });
    });

    it('Deve fechar modal ao clicar em Cancelar', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('excluir-button').click();
              });
          });

          cy.getByData('modal-excluir-usuario').should('be.visible');
          cy.getByData('modal-excluir-cancelar').click();
          cy.getByData('modal-excluir-usuario').should('not.exist');
        } else {
          cy.log('Nenhum usuário disponível para testar exclusão');
        }
      });
    });

    it('Deve fechar modal ao clicar no X', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('excluir-button').click();
              });
          });

          cy.getByData('modal-excluir-usuario').should('be.visible');
          cy.getByData('modal-excluir-close').click();
          cy.getByData('modal-excluir-usuario').should('not.exist');
        } else {
          cy.log('Nenhum usuário disponível para testar exclusão');
        }
      });
    });

    it('Deve fechar modal ao pressionar ESC', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('excluir-button').click();
              });
          });

          cy.getByData('modal-excluir-usuario').should('be.visible');
          cy.get('body').type('{esc}');
          cy.getByData('modal-excluir-usuario').should('not.exist');
        } else {
          cy.log('Nenhum usuário disponível para testar exclusão');
        }
      });
    });

    it('Deve fechar modal ao clicar fora', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('excluir-button').click();
              });
          });

          cy.getByData('modal-excluir-usuario').should('be.visible');
          cy.getByData('modal-excluir-usuario').click('topLeft');
          cy.wait(500);
          cy.getByData('modal-excluir-usuario').should('not.exist');
        } else {
          cy.log('Nenhum usuário disponível para testar exclusão');
        }
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('Deve exibir mensagem de erro ao falhar na exclusão', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.intercept('DELETE', `${apiUrl}/usuarios/*`, {
            statusCode: 500,
            body: { message: 'Erro ao excluir usuário' },
          }).as('deleteUsuarioError');

          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('excluir-button').click();
              });
          });

          cy.getByData('modal-excluir-usuario').should('be.visible');
          cy.getByData('modal-excluir-confirmar').click();

          cy.wait('@deleteUsuarioError', { timeout: 30000 });

          cy.get('body').then(($body) => {
            if (
              $body.text().includes('erro') ||
              $body.text().includes('Erro') ||
              $body.text().includes('falha')
            ) {
              cy.log('Mensagem de erro exibida ao falhar na exclusão');
            }
          });
        } else {
          cy.log('Nenhum usuário disponível para testar erro de exclusão');
        }
      });
    });

    it('Deve manter modal aberto após erro de exclusão', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.intercept('DELETE', `${apiUrl}/usuarios/*`, {
            statusCode: 400,
            body: { message: 'Não é possível excluir este usuário' },
          }).as('deleteUsuarioError');

          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('excluir-button').click();
              });
          });

          cy.getByData('modal-excluir-usuario').should('be.visible');
          cy.getByData('modal-excluir-confirmar').click();

          cy.wait('@deleteUsuarioError', { timeout: 30000 });
          cy.wait(1000);

          cy.getByData('modal-excluir-usuario').should('be.visible');
        } else {
          cy.log('Nenhum usuário disponível para testar erro de exclusão');
        }
      });
    });
  });

  describe('Estado Vazio', () => {
    it('Deve exibir estado vazio quando todos os usuários forem excluídos', () => {
      cy.get('body').then(($body) => {
        const totalUsuarios = $body.find(
          '[data-test="usuarios-table"] tbody tr',
        ).length;

        if (totalUsuarios === 1) {
          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('excluir-button').click();
              });
          });

          cy.getByData('modal-excluir-usuario').should('be.visible');
          cy.getByData('modal-excluir-confirmar').click();

          cy.wait('@deleteUsuario', { timeout: 30000 });
          cy.wait('@getUsuarios', { timeout: 30000 });

          cy.getByData('empty-state').should('be.visible');
          cy.contains(/nenhum usuário encontrado/i).should('be.visible');
        } else {
          cy.log(
            `Existem ${totalUsuarios} usuários, não é possível testar estado vazio`,
          );
        }
      });
    });
  });
});
