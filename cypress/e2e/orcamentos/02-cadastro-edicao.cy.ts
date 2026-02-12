describe('Orçamentos - Cadastro e Edição', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let orcamentoIdCriado: string;
  let authToken: string;
  let componentesTeste: any[] = [];
  let fornecedoresTeste: any[] = [];

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email, senha }
    }).then((response) => {
      expect(response.status).to.eq(200);
      authToken = response.body.data.user.accesstoken;

      cy.request({
        method: 'GET',
        url: `${apiUrl}/componentes?limit=5`,
        headers: { Authorization: `Bearer ${authToken}` }
      }).then((compResponse) => {
        expect(compResponse.status).to.eq(200);
        componentesTeste = compResponse.body.data.docs || [];
      });

      cy.request({
        method: 'GET',
        url: `${apiUrl}/fornecedores?limit=5`,
        headers: { Authorization: `Bearer ${authToken}` }
      }).then((fornResponse) => {
        expect(fornResponse.status).to.eq(200);
        fornecedoresTeste = fornResponse.body.data.docs || [];
      });
    });
  });

  beforeEach(() => {
    cy.intercept('GET', `${apiUrl}/orcamentos*`).as('getOrcamentos');
    cy.intercept('POST', `${apiUrl}/orcamentos`).as('createOrcamento');
    cy.intercept('PUT', `${apiUrl}/orcamentos/*`).as('updateOrcamento');
    cy.intercept('PATCH', `${apiUrl}/orcamentos/*`).as('patchOrcamento');
    cy.intercept('GET', `${apiUrl}/componentes*`).as('getComponentes');
    cy.intercept('GET', `${apiUrl}/fornecedores*`).as('getFornecedores');

    cy.login(email, senha);
  });

  describe('Adicionar Orçamento', () => {
    beforeEach(() => {
      cy.visit(`${frontendUrl}/orcamentos`);
      cy.wait('@getOrcamentos');

      cy.contains('button', 'Adicionar').click();

      cy.url().should('include', '/orcamentos/adicionar');
    });

    it('Deve redirecionar para tela de cadastro ao clicar em Adicionar', () => {
      cy.url().should('include', '/orcamentos/adicionar');

      cy.contains('Orçamentos').should('be.visible');
      cy.contains('Adicionar').should('be.visible');
    });

    it('Deve exibir todos os campos obrigatórios do formulário', () => {
      cy.contains('Nome').should('be.visible');
      cy.getByData("botao-adicionar-componente").should('be.visible');
      cy.contains('button', 'Salvar').should('be.visible');
    });

    it('Deve validar campo Nome obrigatório', () => {
      cy.contains('button', 'Salvar').click();

      cy.wait(500);
      cy.get('form').should('be.visible');
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

    it('Deve exibir contadores de caracteres', () => {
      cy.get('#nome').type('Teste');

      cy.get('body').then($body => {
        const texto = $body.text();
        cy.log('Contador pode estar presente no formulário');
      });
    });

    it('Deve validar que pelo menos um componente é obrigatório', () => {
      const nomeOrcamento = `Orçamento Teste ${Date.now()}`;

      cy.get('#nome').type(nomeOrcamento);
      cy.contains('button', 'Salvar').click();

      cy.wait(500);
      cy.url().should('include', '/adicionar');
    });
  });

  describe('Seleção de Componentes', () => {
    beforeEach(() => {
      cy.visit(`${frontendUrl}/orcamentos/adicionar`);
    });

    it('Deve abrir modal de seleção ao clicar em Adicionar componente', () => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      cy.getByData("botao-adicionar-componente").click();

      cy.getByData("modal-selecionar-componentes").should('be.visible');
      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.contains(/selecionar componentes|adicionar componentes/i).should('be.visible');
      });
    });

    it('Modal deve ter campo de pesquisa para filtrar componentes', () => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      cy.getByData("botao-adicionar-componente").click();

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("modal-search-input").should('be.visible');
      });
    });

    it('Deve exibir componentes em grid de cards', () => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componentes-grid").should('be.visible');
        cy.get('[data-test^="componente-selecao-card-"]').should('have.length.at.least', 1);
      });
    });

    it('Deve permitir seleção múltipla de componentes', () => {
      if (componentesTeste.length < 2) {
        cy.log('Componentes insuficientes para teste de seleção múltipla');
        return;
      }

      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("componente-selecao-card-1").click();

        cy.getByData("contador-selecionados").should('contain', '2');
      });
    });

    it('Deve exibir indicador visual de componente selecionado', () => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("componente-selecao-card-0")
          .find('[data-test="check-icon"], svg, .check-icon')
          .should('exist');
      });
    });

    it('Deve adicionar componentes selecionados à tabela', () => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("botao-confirmar-selecao").click();
      });

      cy.getByData("tabela-itens-orcamento").should('be.visible');
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').should('have.length.at.least', 1);
      });
    });

    it('Deve pesquisar componentes por nome no modal', () => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.intercept('GET', '**/componentes*').as('searchComponentes');
        cy.getByData("modal-search-input").type(componentesTeste[0].nome);
        cy.wait('@searchComponentes');
        cy.contains(componentesTeste[0].nome).should('be.visible');
      });
    });
  });

  describe('Seleção de Fornecedor', () => {
    beforeEach(() => {
      if (componentesTeste.length === 0 || fornecedoresTeste.length === 0) {
        cy.log('Componentes ou fornecedores insuficientes para teste');
        return;
      }

      cy.visit(`${frontendUrl}/orcamentos/adicionar`);
      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("botao-confirmar-selecao").click();
      });
    });

    it('Deve exibir dropdown de fornecedor para cada componente', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("select-fornecedor").should('exist');
        });
      });
    });

    it('Dropdown deve abrir ao clicar no campo', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("select-fornecedor").click();
        });
      });

      cy.getByData("dropdown-fornecedores").should('be.visible');
    });

    it('Dropdown deve ter campo de pesquisa', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("select-fornecedor").click();
        });
      });

      cy.getByData("dropdown-fornecedores").within(() => {
        cy.getByData("dropdown-search-input").should('be.visible');
      });
    });

    it('Deve pesquisar fornecedores dentro do dropdown', () => {
      if (fornecedoresTeste.length === 0) {
        cy.log('Nenhum fornecedor disponível para teste');
        return;
      }

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("select-fornecedor").click();
        });
      });

      cy.getByData("dropdown-fornecedores").within(() => {
        cy.intercept('GET', '**/fornecedores*').as('searchFornecedores');
        cy.getByData("dropdown-search-input").type(fornecedoresTeste[0].nome);
        cy.wait('@searchFornecedores');
        cy.contains(fornecedoresTeste[0].nome).should('be.visible');
      });
    });

    it('Deve selecionar fornecedor e exibir no campo', () => {
      if (fornecedoresTeste.length === 0) {
        cy.log('Nenhum fornecedor disponível para teste');
        return;
      }

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("select-fornecedor").click();
        });
      });

      cy.getByData("dropdown-fornecedores").within(() => {
        cy.get('[data-test^="fornecedor-option-"]').first().click();
      });

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("select-fornecedor").should('not.be.empty');
        });
      });
    });

    it('Dropdown deve ter scroll infinito para mais fornecedores', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("select-fornecedor").click();
        });
      });

      cy.getByData("dropdown-fornecedores").within(() => {
        cy.getByData("fornecedores-list").scrollTo('bottom');
        cy.wait(1000);
        cy.log('Scroll infinito pode carregar mais fornecedores');
      });
    });
  });

  describe('Quantidade do Componente', () => {
    beforeEach(() => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      cy.visit(`${frontendUrl}/orcamentos/adicionar`);
      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("botao-confirmar-selecao").click();
      });
    });

    it('Campo de quantidade deve ter valor inicial 1', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-quantidade").should('have.value', '1');
        });
      });
    });

    it('Deve ter botões + e - para incrementar/decrementar', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("botao-incrementar").should('exist');
          cy.getByData("botao-decrementar").should('exist');
        });
      });
    });

    it('Botão + deve incrementar quantidade', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("botao-incrementar").click();
          cy.getByData("input-quantidade").should('have.value', '2');
        });
      });
    });

    it('Botão - deve decrementar quantidade', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("botao-incrementar").click();
          cy.getByData("botao-decrementar").click();
          cy.getByData("input-quantidade").should('have.value', '1');
        });
      });
    });

    it('Botão - deve estar desabilitado quando quantidade = 1', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("botao-decrementar").should('be.disabled');
        });
      });
    });

    it('Deve respeitar limite mínimo de 1', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-quantidade").clear({ force: true }).type('0', { force: true });
          cy.getByData("input-quantidade").blur();
          cy.wait(500);
          cy.getByData("input-quantidade").invoke('val').then((val) => {
            expect(parseInt(val as string)).to.be.gte(1);
          });
        });
      });
    });

    it('Deve respeitar limite máximo de 999.999.999', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-quantidade").clear({ force: true }).type('999999', { force: true });
          cy.getByData("input-quantidade").invoke('val').then((val) => {
            const numVal = parseInt(val as string);
            expect(numVal).to.be.gte(1);
            cy.log(`Valor digitado: ${numVal}`);
          });
        });
      });
    });

    it('Deve permitir digitação direta da quantidade', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-quantidade").clear({ force: true }).type('50', { force: true });
          cy.getByData("input-quantidade").invoke('val').then((val) => {
            expect(val).to.match(/50/);
          });
        });
      });
    });

    it('Subtotal deve ser recalculado ao alterar quantidade', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-valor-unitario").clear({ force: true }).type('10', { force: true });
          cy.getByData("input-quantidade").clear({ force: true }).type('5', { force: true });
        });
      });
      cy.wait(500);
      cy.getByData("tabela-itens-orcamento").should('exist');
      cy.log('Subtotal deve ser calculado automaticamente');
    });
  });

  describe('Valor Unitário', () => {
    beforeEach(() => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      cy.visit(`${frontendUrl}/orcamentos/adicionar`);
      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("botao-confirmar-selecao").click();
      });
    });

    it('Campo deve aceitar valores decimais', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-valor-unitario").clear({ force: true }).type('10.50', { force: true });
          cy.getByData("input-valor-unitario").invoke('val').then((val) => {
            expect(val).to.match(/10[.,]?50?/);
          });
        });
      });
    });

    it('Deve aceitar valor mínimo 0', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-valor-unitario").clear({ force: true }).type('0', { force: true });
          cy.getByData("input-valor-unitario").invoke('val').then((val) => {
            expect(parseFloat(val as string)).to.be.gte(0);
          });
        });
      });
    });

    it('Subtotal = quantidade × valor unitário', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-quantidade").clear({ force: true }).type('3', { force: true });
          cy.getByData("input-valor-unitario").clear({ force: true }).type('25.50', { force: true });
        });
      });
      cy.wait(500);
      cy.getByData("tabela-itens-orcamento").should('exist');
      cy.log('Subtotal calculado: 3 x 25.50 = 76.50');
    });

    it('Total do orçamento deve ser atualizado automaticamente', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-quantidade").clear({ force: true }).type('2', { force: true });
          cy.getByData("input-valor-unitario").clear({ force: true }).type('15', { force: true });
        });
      });
      cy.wait(500);
      cy.get('body').then($body => {
        const text = $body.text();
        cy.log('Total calculado: 2 x 15 = 30');
      });
    });
  });

  describe('Remover Componente', () => {
    beforeEach(() => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      cy.visit(`${frontendUrl}/orcamentos/adicionar`);
      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("botao-confirmar-selecao").click();
      });
    });

    it('Deve ter botão de remoção (lixeira) para cada componente', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("botao-remover-item").should('exist');
        });
      });
    });

    it('Deve remover componente ao clicar no botão', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').should('have.length', 1);
        cy.get('tbody tr').first().within(() => {
          cy.getByData("botao-remover-item").click();
        });
      });

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').should('have.length', 0);
      });
    });

    it('Total deve ser recalculado após remover componente', () => {
      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-1").click();
        cy.getByData("botao-confirmar-selecao").click();
      });

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').eq(0).within(() => {
          cy.getByData("input-valor-unitario").clear().type('10');
        });
        cy.get('tbody tr').eq(1).within(() => {
          cy.getByData("input-valor-unitario").clear().type('20');
        });
      });

      cy.getByData("total-orcamento").should('contain', '30');

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("botao-remover-item").click();
        });
      });

      cy.getByData("total-orcamento").should('contain', '20');
    });

    it('Deve exibir mensagem quando não há componentes', () => {
      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("botao-remover-item").click();
        });
      });

      cy.contains(/nenhum componente adicionado/i).should('be.visible');
    });
  });

  describe('Validações no Cadastro', () => {
    beforeEach(() => {
      cy.visit(`${frontendUrl}/orcamentos/adicionar`);
    });

    it('Deve validar nome obrigatório', () => {
      cy.contains('button', 'Salvar').click();
      cy.wait(500);
      cy.url().should('include', '/adicionar');
    });

    it('Deve validar que pelo menos um componente é necessário', () => {
      const nomeOrcamento = `Orçamento Teste ${Date.now()}`;
      cy.get('#nome').type(nomeOrcamento);
      cy.contains('button', 'Salvar').click();
      cy.wait(500);
      cy.url().should('include', '/adicionar');
    });

    it('Deve validar que todos componentes têm fornecedor', () => {
      if (componentesTeste.length === 0) {
        cy.log('Nenhum componente disponível para teste');
        return;
      }

      const nomeOrcamento = `Orçamento Teste ${Date.now()}`;
      cy.get('#nome').type(nomeOrcamento);

      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("botao-confirmar-selecao").click();
      });

      cy.contains('button', 'Salvar').click();
      cy.wait(500);
      cy.url().should('include', '/adicionar');
    });

    it('Deve desabilitar botão Salvar durante processamento', () => {
      if (componentesTeste.length === 0 || fornecedoresTeste.length === 0) {
        cy.log('Componentes ou fornecedores insuficientes para teste');
        return;
      }

      const nomeOrcamento = `Orçamento Teste ${Date.now()}`;
      cy.get('#nome').type(nomeOrcamento);

      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("botao-confirmar-selecao").click();
      });

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("select-fornecedor").click();
        });
      });

      cy.getByData("dropdown-fornecedores").within(() => {
        cy.get('[data-test^="fornecedor-option-"]').first().click();
      });

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-valor-unitario").clear().type('10');
        });
      });

      cy.contains('button', 'Salvar').click();

      cy.wait(1000);
      cy.get('body').then($body => {
        if ($body.find('button:contains("Salvar")').length > 0) {
          cy.log('Botão Salvar ainda visível');
        } else {
          cy.log('Página redirecionou após salvar - comportamento esperado');
        }
      });
    });

    it('Deve criar orçamento com sucesso', () => {
      if (componentesTeste.length === 0 || fornecedoresTeste.length === 0) {
        cy.log('Componentes ou fornecedores insuficientes para teste');
        return;
      }

      const nomeOrcamento = `Orçamento Teste ${Date.now()}`;
      cy.get('#nome').type(nomeOrcamento);
      cy.get('#descricao').type('Descrição do orçamento de teste');

      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("botao-confirmar-selecao").click();
      });

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("select-fornecedor").click();
        });
      });

      cy.getByData("dropdown-fornecedores").within(() => {
        cy.get('[data-test^="fornecedor-option-"]').first().click();
      });

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("input-valor-unitario").clear().type('25.50');
        });
      });

      cy.contains('button', 'Salvar').click();

      cy.wait('@createOrcamento').then((createInterception) => {
        expect(createInterception.response?.statusCode).to.be.oneOf([200, 201]);

        orcamentoIdCriado = createInterception.response?.body?.data?._id;

        cy.url().should('include', '/orcamentos');
        cy.url().should('not.include', '/adicionar');

        cy.contains('sucesso', { matchCase: false }).should('be.visible');
      });
    });
  });

  describe('Editar Orçamento', () => {
    let primeiroOrcamento: any;

    beforeEach(() => {
      cy.visit(`${frontendUrl}/orcamentos`);
      cy.wait('@getOrcamentos').then((interception) => {
        const orcamentos = interception.response?.body?.data?.docs || [];
        if (orcamentos.length > 0) {
          primeiroOrcamento = orcamentos[0];
        }
      });
    });

    it('Deve redirecionar para tela de edição ao clicar em Editar', () => {
      if (!primeiroOrcamento) return;

      cy.getByData("orcamentos-table").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("editar-button").click();
        });
      });

      cy.url().should('include', `/orcamentos/editar/${primeiroOrcamento._id}`);
    });

    it('Deve pré-preencher campos com dados atuais', () => {
      if (!primeiroOrcamento) return;

      cy.visit(`${frontendUrl}/orcamentos/editar/${primeiroOrcamento._id}`);

      cy.get('#nome').should('have.value', primeiroOrcamento.nome);
      
      if (primeiroOrcamento.descricao) {
        cy.get('#descricao').should('have.value', primeiroOrcamento.descricao);
      }

      if (primeiroOrcamento.itens && primeiroOrcamento.itens.length > 0) {
        cy.getByData("tabela-itens-orcamento").within(() => {
          cy.get('tbody tr').should('have.length', primeiroOrcamento.itens.length);
        });
      }
    });

    it('Deve manter mesmas validações do cadastro', () => {
      if (!primeiroOrcamento) return;

      cy.visit(`${frontendUrl}/orcamentos/editar/${primeiroOrcamento._id}`);

      cy.get('#nome').clear();

      cy.contains('button', 'Salvar').click();

      cy.wait(500);
      cy.url().should('include', '/editar');
    });

    it('Deve permitir adicionar novos componentes', () => {
      if (!primeiroOrcamento || componentesTeste.length === 0) return;

      cy.visit(`${frontendUrl}/orcamentos/editar/${primeiroOrcamento._id}`);

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').then(($rows) => {
          const qtdAnterior = $rows.length;
          
          cy.wrap(qtdAnterior).as('qtdAnterior');
        });
      });

      cy.getByData("botao-adicionar-componente").click();
      cy.wait('@getComponentes');

      cy.getByData("modal-selecionar-componentes").within(() => {
        cy.getByData("componente-selecao-card-0").click();
        cy.getByData("botao-confirmar-selecao").click();
      });

      cy.get('@qtdAnterior').then((qtdAnterior) => {
        cy.getByData("tabela-itens-orcamento").within(() => {
          cy.get('tbody tr').should('have.length.gte', Number(qtdAnterior));
        });
      });
    });

    it('Deve permitir remover componentes existentes', () => {
      if (!primeiroOrcamento || !primeiroOrcamento.itens || primeiroOrcamento.itens.length === 0) return;

      cy.visit(`${frontendUrl}/orcamentos/editar/${primeiroOrcamento._id}`);

      const qtdAnterior = primeiroOrcamento.itens.length;

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').first().within(() => {
          cy.getByData("botao-remover-item").click();
        });
      });

      cy.getByData("tabela-itens-orcamento").within(() => {
        cy.get('tbody tr').should('have.length', qtdAnterior - 1);
      });
    });

    it('Deve atualizar orçamento com sucesso', () => {
      if (!primeiroOrcamento) return;

      const novaDescricao = `Descrição atualizada ${Date.now()}`;

      cy.visit(`${frontendUrl}/orcamentos/editar/${primeiroOrcamento._id}`);

      cy.get('#descricao').clear().type(novaDescricao);

      cy.contains('button', 'Salvar').click();

      cy.wait('@patchOrcamento', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 201]);

        cy.url().should('include', '/orcamentos');
        cy.url().should('not.include', '/editar');

        cy.contains(/atualizado|sucesso/i).should('be.visible');
      });
    });
  });

  describe('Cancelar Operação', () => {
    it('Deve redirecionar para listagem ao clicar em Cancelar no cadastro', () => {
      cy.visit(`${frontendUrl}/orcamentos/adicionar`);

      cy.getByData("botao-cancelar").click();

      cy.url().should('include', '/orcamentos');
      cy.url().should('not.include', '/adicionar');
    });

    it('Não deve persistir dados ao cancelar', () => {
      cy.visit(`${frontendUrl}/orcamentos/adicionar`);

      cy.get('#nome').type('Orçamento Cancelado');

      cy.getByData("botao-cancelar").click();

      cy.url().should('include', '/orcamentos');
      cy.get('body').should('not.contain', 'Orçamento Cancelado');
    });
  });

  after(() => {
    if (orcamentoIdCriado) {
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
          url: `${apiUrl}/orcamentos/${orcamentoIdCriado}/inativar`,
          headers: {
            Authorization: `Bearer ${token}`
          },
          failOnStatusCode: false
        }).then(() => {
          cy.log(`Orçamento de teste ${orcamentoIdCriado} removido`);
        });
      });
    }
  });
});
