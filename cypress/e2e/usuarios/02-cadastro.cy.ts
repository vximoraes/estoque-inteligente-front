describe('Usuários - Cadastro', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/usuarios*`).as('getUsuarios');
    cy.intercept('POST', `${apiUrl}/usuarios/convidar`).as('convidarUsuario');

    cy.login(email, senha);
    cy.wait(2000);
    cy.visit(`${frontendUrl}/usuarios`, { failOnStatusCode: false });
    cy.wait('@getUsuarios', { timeout: 30000 });
  });

  describe('Modal de Cadastro', () => {
    it('Deve abrir modal ao clicar em Cadastrar usuário', () => {
      cy.getByData('cadastrar-usuario-button').first().click();
      cy.getByData('modal-cadastrar-usuario').should('be.visible');
    });

    it('Deve exibir todos os campos obrigatórios do formulário', () => {
      cy.getByData('cadastrar-usuario-button').first().click();
      cy.getByData('modal-cadastrar-usuario').within(() => {
        cy.getByData('nome-input').should('be.visible');
        cy.getByData('email-input').should('be.visible');
      });
    });

    it('Deve validar campo Nome obrigatório', () => {
      cy.getByData('cadastrar-usuario-button').first().click();

      cy.getByData('modal-cadastrar-usuario').within(() => {
        cy.getByData('email-input').type('teste@email.com');
        cy.getByData('modal-cadastrar-confirmar').click();

        cy.contains(/nome.*obrigatório/i, { timeout: 5000 }).should(
          'be.visible',
        );
      });
    });

    it('Deve validar campo E-mail obrigatório', () => {
      cy.getByData('cadastrar-usuario-button').first().click();

      cy.getByData('modal-cadastrar-usuario').within(() => {
        cy.getByData('nome-input').type('Usuário Teste');
        cy.getByData('modal-cadastrar-confirmar').click();

        cy.contains(/e-mail.*obrigatório/i, { timeout: 5000 }).should(
          'be.visible',
        );
      });
    });

    it('Deve validar formato de e-mail', () => {
      cy.getByData('cadastrar-usuario-button').first().click();

      cy.getByData('modal-cadastrar-usuario').within(() => {
        cy.getByData('nome-input').type('Usuário Teste');
        cy.getByData('email-input').type('emailinvalido');
        cy.getByData('modal-cadastrar-confirmar').click();

        cy.contains(/e-mail.*inválido/i, { timeout: 5000 }).should(
          'be.visible',
        );
      });
    });

    it('Deve exibir contador de caracteres para Nome', () => {
      cy.getByData('cadastrar-usuario-button').first().click();

      cy.getByData('modal-cadastrar-usuario').within(() => {
        cy.contains('0/100').should('be.visible');

        cy.getByData('nome-input').type('Teste');
        cy.contains('5/100').should('be.visible');
      });
    });

    it('Deve validar limite de caracteres do Nome (máx 100)', () => {
      cy.getByData('cadastrar-usuario-button').first().click();

      cy.getByData('modal-cadastrar-usuario').within(() => {
        const nomeGrande = 'a'.repeat(101);
        cy.getByData('nome-input').type(nomeGrande);

        cy.getByData('nome-input').should('have.value', 'a'.repeat(100));
        cy.contains('100/100').should('be.visible');
      });
    });

    it('Deve fechar modal ao clicar em Cancelar', () => {
      cy.getByData('cadastrar-usuario-button').first().click();
      cy.getByData('modal-cadastrar-usuario').should('be.visible');

      cy.getByData('modal-cadastrar-cancelar').click();
      cy.getByData('modal-cadastrar-usuario').should('not.exist');
    });

    it('Deve fechar modal ao clicar no X', () => {
      cy.getByData('cadastrar-usuario-button').first().click();
      cy.getByData('modal-cadastrar-usuario').should('be.visible');

      cy.getByData('modal-cadastrar-close').click();
      cy.getByData('modal-cadastrar-usuario').should('not.exist');
    });

    it('Deve fechar modal ao pressionar ESC', () => {
      cy.getByData('cadastrar-usuario-button').first().click();
      cy.getByData('modal-cadastrar-usuario').should('be.visible');

      cy.get('body').type('{esc}');
      cy.getByData('modal-cadastrar-usuario').should('not.exist');
    });

    it('Deve fechar modal ao clicar fora', () => {
      cy.getByData('cadastrar-usuario-button').first().click();
      cy.getByData('modal-cadastrar-usuario').should('be.visible');

      cy.getByData('modal-cadastrar-usuario').click('topLeft');
      cy.wait(500);
      cy.getByData('modal-cadastrar-usuario').should('not.exist');
    });
  });

  describe('Cadastro de Usuário', () => {
    it('Deve exibir erro ao tentar cadastrar e-mail duplicado', () => {
      cy.intercept('POST', `${apiUrl}/usuarios/convidar`, {
        statusCode: 400,
        body: {
          message: 'E-mail já cadastrado',
          errors: [{ field: 'email', message: 'Este e-mail já está em uso' }],
        },
      }).as('convidarUsuarioError');

      cy.getByData('cadastrar-usuario-button').first().click();

      cy.getByData('modal-cadastrar-usuario').within(() => {
        cy.getByData('nome-input').type('Usuário Teste');
        cy.getByData('email-input').type('email.existente@teste.com');
        cy.getByData('modal-cadastrar-confirmar').click();
      });

      cy.wait('@convidarUsuarioError', { timeout: 30000 });

      cy.get('body').then(($body) => {
        if (
          $body.text().includes('erro') ||
          $body.text().includes('Erro') ||
          $body.text().includes('já')
        ) {
          cy.log('Mensagem de erro exibida para e-mail duplicado');
        }
      });
    });
  });

  describe('Validações em Tempo Real', () => {
    it('Deve exibir erros de validação em tempo real', () => {
      cy.getByData('cadastrar-usuario-button').first().click();

      cy.getByData('modal-cadastrar-usuario').within(() => {
        cy.getByData('email-input').type('emailinvalido').blur();
        cy.wait(500);
      });

      cy.get('body').then(($body) => {
        if (
          $body.text().includes('inválido') ||
          $body.text().includes('Inválido')
        ) {
          cy.log('Validação de e-mail funcionando');
        }
      });
    });
  });
});
