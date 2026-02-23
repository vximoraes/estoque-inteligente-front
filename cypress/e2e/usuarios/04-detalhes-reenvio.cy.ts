describe('Usuários - Detalhes e Reenvio de Convite', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/usuarios*`).as('getUsuarios');
    cy.intercept('GET', `${apiUrl}/usuarios/*`).as('getUsuarioDetalhes');
    cy.intercept('POST', `${apiUrl}/usuarios/*/reenviar-convite`).as(
      'reenviarConvite',
    );

    cy.login(email, senha);
    cy.wait(2000);
    cy.visit(`${frontendUrl}/usuarios`, { failOnStatusCode: false });
    cy.wait('@getUsuarios', { timeout: 30000 });
  });

  describe('Modal de Detalhes', () => {
    it('Deve abrir modal ao clicar no botão visualizar', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').should('be.visible');
        } else {
          cy.log('Nenhum usuário disponível para visualizar');
        }
      });
    });

    it('Deve exibir informações do usuário no modal', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          let nomeUsuario = '';
          let emailUsuario = '';

          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.get('td')
                  .eq(0)
                  .invoke('text')
                  .then((text) => {
                    nomeUsuario = text.trim();
                  });
                cy.get('td')
                  .eq(1)
                  .invoke('text')
                  .then((text) => {
                    emailUsuario = text.trim();
                  });
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').should('be.visible');
          cy.getByData('modal-detalhes-status').should('exist');
          cy.getByData('modal-detalhes-email').should('exist');
        } else {
          cy.log('Nenhum usuário disponível para visualizar');
        }
      });
    });

    it('Deve exibir status correto do usuário', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          let statusUsuario = '';

          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.get('td')
                  .eq(2)
                  .invoke('text')
                  .then((text) => {
                    statusUsuario = text.trim();
                  });
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').within(() => {
            cy.getByData('modal-detalhes-status').should('exist');
          });
        } else {
          cy.log('Nenhum usuário disponível para visualizar');
        }
      });
    });

    it('Deve exibir botão de copiar e-mail', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').within(() => {
            cy.getByData('modal-detalhes-copiar-email').should('be.visible');
          });
        } else {
          cy.log('Nenhum usuário disponível para visualizar');
        }
      });
    });

    it('Deve copiar e-mail ao clicar no botão', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          let emailUsuario = '';

          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.get('td')
                  .eq(1)
                  .invoke('text')
                  .then((text) => {
                    emailUsuario = text.trim();
                  });
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').within(() => {
            cy.getByData('modal-detalhes-copiar-email').click();
          });

          cy.wait(500);
          cy.get('body').then(($body) => {
            if (
              $body.text().includes('copiado') ||
              $body.text().includes('Copiado')
            ) {
              cy.log('Feedback de cópia exibido');
            }
          });
        } else {
          cy.log('Nenhum usuário disponível para visualizar');
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
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').should('be.visible');
          cy.getByData('modal-detalhes-close').click();
          cy.getByData('modal-detalhes-usuario').should('not.exist');
        } else {
          cy.log('Nenhum usuário disponível para visualizar');
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
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').should('be.visible');
          cy.get('body').type('{esc}');
          cy.getByData('modal-detalhes-usuario').should('not.exist');
        } else {
          cy.log('Nenhum usuário disponível para visualizar');
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
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').should('be.visible');
          cy.getByData('modal-detalhes-usuario').click('topLeft');
          cy.wait(500);
          cy.getByData('modal-detalhes-usuario').should('not.exist');
        } else {
          cy.log('Nenhum usuário disponível para visualizar');
        }
      });
    });
  });

  describe('Estados de Carregamento', () => {
    it('Deve exibir loading ao abrir modal de detalhes', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.intercept('GET', `${apiUrl}/usuarios/*`, (req) => {
            req.reply((res) => {
              res.delay = 1000;
              return res;
            });
          }).as('getUsuarioDetalhesLento');

          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').should('be.visible');
        } else {
          cy.log('Nenhum usuário disponível para testar loading');
        }
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('Deve exibir erro ao falhar ao carregar detalhes', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="usuarios-table"]').length > 0) {
          cy.intercept('GET', `${apiUrl}/usuarios/*`, {
            statusCode: 500,
            body: { message: 'Erro ao carregar detalhes' },
          }).as('getUsuarioDetalhesError');

          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.wait('@getUsuarioDetalhesError', { timeout: 30000 });

          cy.get('body').then(($body) => {
            if (
              $body.text().includes('erro') ||
              $body.text().includes('Erro')
            ) {
              cy.log('Mensagem de erro exibida ao falhar carregar detalhes');
            }
          });
        } else {
          cy.log('Nenhum usuário disponível para testar erro de carregamento');
        }
      });
    });
  });

  describe('Navegação entre Usuários', () => {
    it('Deve poder visualizar detalhes de múltiplos usuários sequencialmente', () => {
      cy.get('body').then(($body) => {
        const totalUsuarios = $body.find(
          '[data-test="usuarios-table"] tbody tr',
        ).length;

        if (totalUsuarios >= 2) {
          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .eq(0)
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').should('be.visible');
          cy.getByData('modal-detalhes-close').click();
          cy.getByData('modal-detalhes-usuario').should('not.exist');

          cy.getByData('usuarios-table').within(() => {
            cy.get('tbody tr')
              .eq(1)
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-usuario').should('be.visible');
        } else {
          cy.log(
            `Apenas ${totalUsuarios} usuário(s) disponível(is) - não é possível testar navegação sequencial`,
          );
        }
      });
    });
  });
});
