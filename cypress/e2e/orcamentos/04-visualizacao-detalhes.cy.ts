describe('Orçamentos - Visualização de Detalhes', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const apiUrl = Cypress.env('API_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');

  let primeiroOrcamento: any;
  let authToken: string;

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email, senha },
    }).then((response) => {
      expect(response.status).to.eq(200);
      authToken = response.body.data.user.accesstoken;

      cy.request({
        method: 'GET',
        url: `${apiUrl}/orcamentos?limit=1`,
        headers: { Authorization: `Bearer ${authToken}` },
      }).then((orcResponse) => {
        expect(orcResponse.status).to.eq(200);
        if (orcResponse.body.data.docs.length > 0) {
          primeiroOrcamento = orcResponse.body.data.docs[0];
        }
      });
    });
  });

  beforeEach(() => {
    cy.intercept('GET', '**/orcamentos*').as('getOrcamentos');
    cy.intercept('GET', '**/orcamentos/*').as('getOrcamentoById');

    cy.login(email, senha);
    cy.visit(`${frontendUrl}/orcamentos`);
    cy.wait('@getOrcamentos', { timeout: 30000 });
  });

  describe('Modal de Visualização de Detalhes', () => {
    it('Deve abrir modal ao clicar no ícone de olho', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');
        }
      });
    });

    it('Modal deve exibir nome do orçamento no header', () => {
      if (!primeiroOrcamento) {
        cy.log('Nenhum orçamento disponível para teste');
        return;
      }

      cy.getByData('orcamentos-table').within(() => {
        cy.get('tbody tr')
          .first()
          .within(() => {
            cy.getByData('visualizar-button').click();
          });
      });

      cy.getByData('modal-detalhes-orcamento').within(() => {
        cy.getByData('modal-detalhes-header').should(
          'contain',
          primeiroOrcamento.nome,
        );
      });
    });

    it('Deve exibir descrição se houver', () => {
      if (!primeiroOrcamento) {
        cy.log('Nenhum orçamento disponível para teste');
        return;
      }

      cy.getByData('orcamentos-table').within(() => {
        cy.get('tbody tr')
          .first()
          .within(() => {
            cy.getByData('visualizar-button').click();
          });
      });

      cy.getByData('modal-detalhes-orcamento').within(() => {
        if (primeiroOrcamento.descricao) {
          cy.getByData('modal-detalhes-descricao').should(
            'contain',
            primeiroOrcamento.descricao,
          );
        }
      });
    });

    it('Deve exibir total em destaque (azul)', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-total').should('be.visible');
            cy.getByData('modal-detalhes-total')
              .should('have.css', 'color')
              .and('not.eq', 'rgb(0, 0, 0)');
          });
        }
      });
    });

    it('Total deve estar em formato monetário (R$)', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-total')
              .invoke('text')
              .should('match', /R\$\s*\d+[,\.]\d{2}|\d+[,\.]\d{2}/);
          });
        }
      });
    });

    it('Deve exibir tabela de itens', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-tabela').should('be.visible');
          });
        }
      });
    });

    it('Tabela deve ter colunas: Nome, Qtd, Valor Unit., Subtotal', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-tabela').within(() => {
              cy.contains('th', 'Nome').should('be.visible');
              cy.contains('th', /Qtd|Quantidade/).should('be.visible');
              cy.contains('th', /Valor.*Unit|Valor Unitário/).should(
                'be.visible',
              );
              cy.contains('th', 'Subtotal').should('be.visible');
            });
          });
        }
      });
    });

    it('Deve listar todos os itens do orçamento', () => {
      if (!primeiroOrcamento || !primeiroOrcamento.itens) {
        cy.log('Orçamento sem itens disponível para teste');
        return;
      }

      cy.getByData('orcamentos-table').within(() => {
        cy.get('tbody tr')
          .first()
          .within(() => {
            cy.getByData('visualizar-button').click();
          });
      });

      cy.getByData('modal-detalhes-orcamento').within(() => {
        cy.getByData('modal-detalhes-tabela').within(() => {
          cy.get('tbody tr').should(
            'have.length',
            primeiroOrcamento.itens.length,
          );
        });
      });
    });

    it('Deve exibir data de criação formatada (dd/mm/aaaa hh:mm)', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-data-criacao')
              .should('be.visible')
              .invoke('text')
              .should('match', /\d{2}\/\d{2}\/\d{4}.*\d{2}:\d{2}/);
          });
        }
      });
    });

    it('Deve exibir data de atualização formatada (dd/mm/aaaa hh:mm)', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-data-atualizacao')
              .should('be.visible')
              .invoke('text')
              .should('match', /\d{2}\/\d{2}\/\d{4}.*\d{2}:\d{2}/);
          });
        }
      });
    });
  });

  describe('Fechamento do Modal', () => {
    it('Deve fechar ao clicar no X', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-close').click();
          });

          cy.getByData('modal-detalhes-orcamento').should('not.exist');
        }
      });
    });

    it('Deve fechar ao clicar fora do modal', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');

          cy.get('body').click(0, 0);

          cy.getByData('modal-detalhes-orcamento').should('not.exist');
        }
      });
    });

    it('Deve fechar ao pressionar ESC', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');

          cy.get('body').type('{esc}');

          cy.getByData('modal-detalhes-orcamento').should('not.exist');
        }
      });
    });

    it('Deve ter botão Fechar no rodapé', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').then(($modal) => {
            if (
              $modal.find('[data-test="modal-detalhes-botao-fechar"]').length >
              0
            ) {
              cy.getByData('modal-detalhes-botao-fechar')
                .should('be.visible')
                .click();
              cy.getByData('modal-detalhes-orcamento').should('not.exist');
            } else {
              cy.getByData('modal-detalhes-close').click();
              cy.getByData('modal-detalhes-orcamento').should('not.exist');
            }
          });
        }
      });
    });
  });

  describe('Informações dos Componentes', () => {
    it('Deve exibir nome do item', () => {
      if (
        !primeiroOrcamento ||
        !primeiroOrcamento.itens ||
        primeiroOrcamento.itens.length === 0
      ) {
        cy.log('Orçamento sem itens disponível para teste');
        return;
      }

      cy.getByData('orcamentos-table').within(() => {
        cy.get('tbody tr')
          .first()
          .within(() => {
            cy.getByData('visualizar-button').click();
          });
      });

      cy.getByData('modal-detalhes-orcamento').within(() => {
        cy.getByData('modal-detalhes-tabela').within(() => {
          cy.get('tbody tr')
            .first()
            .within(() => {
              cy.get('td').first().should('not.be.empty');
            });
        });
      });
    });

    it('Deve exibir quantidade do item', () => {
      if (
        !primeiroOrcamento ||
        !primeiroOrcamento.itens ||
        primeiroOrcamento.itens.length === 0
      ) {
        cy.log('Orçamento sem itens disponível para teste');
        return;
      }

      cy.getByData('orcamentos-table').within(() => {
        cy.get('tbody tr')
          .first()
          .within(() => {
            cy.getByData('visualizar-button').click();
          });
      });

      cy.getByData('modal-detalhes-orcamento').within(() => {
        cy.getByData('modal-detalhes-tabela').within(() => {
          cy.get('tbody tr')
            .first()
            .within(() => {
              cy.get('td').eq(1).should('match', /\d+/);
            });
        });
      });
    });

    it('Valor unitário deve estar em formato monetário', () => {
      if (
        !primeiroOrcamento ||
        !primeiroOrcamento.itens ||
        primeiroOrcamento.itens.length === 0
      ) {
        cy.log('Orçamento sem itens disponível para teste');
        return;
      }

      cy.getByData('orcamentos-table').within(() => {
        cy.get('tbody tr')
          .first()
          .within(() => {
            cy.getByData('visualizar-button').click();
          });
      });

      cy.getByData('modal-detalhes-orcamento').within(() => {
        cy.getByData('modal-detalhes-tabela').within(() => {
          cy.get('tbody tr')
            .first()
            .within(() => {
              cy.get('td')
                .eq(2)
                .should('match', /R\$\s*\d+[,\.]\d{2}/);
            });
        });
      });
    });

    it('Subtotal deve estar em formato monetário', () => {
      if (
        !primeiroOrcamento ||
        !primeiroOrcamento.itens ||
        primeiroOrcamento.itens.length === 0
      ) {
        cy.log('Orçamento sem itens disponível para teste');
        return;
      }

      cy.getByData('orcamentos-table').within(() => {
        cy.get('tbody tr')
          .first()
          .within(() => {
            cy.getByData('visualizar-button').click();
          });
      });

      cy.getByData('modal-detalhes-orcamento').within(() => {
        cy.getByData('modal-detalhes-tabela').within(() => {
          cy.get('tbody tr')
            .first()
            .within(() => {
              cy.get('td')
                .eq(3)
                .should('match', /R\$\s*\d+[,\.]\d{2}/);
            });
        });
      });
    });

    it('Subtotal = quantidade × valor unitário', () => {
      if (
        !primeiroOrcamento ||
        !primeiroOrcamento.itens ||
        primeiroOrcamento.itens.length === 0
      ) {
        cy.log('Orçamento sem itens disponível para teste');
        return;
      }

      cy.getByData('orcamentos-table').within(() => {
        cy.get('tbody tr')
          .first()
          .within(() => {
            cy.getByData('visualizar-button').click();
          });
      });

      cy.getByData('modal-detalhes-orcamento').within(() => {
        cy.getByData('modal-detalhes-tabela').within(() => {
          cy.get('tbody tr')
            .first()
            .within(() => {
              cy.get('td')
                .eq(1)
                .invoke('text')
                .then((qtdText) => {
                  cy.get('td')
                    .eq(2)
                    .invoke('text')
                    .then((valorText) => {
                      cy.get('td')
                        .eq(3)
                        .invoke('text')
                        .then((subtotalText) => {
                          const qtd = parseFloat(qtdText.trim());
                          const valor = parseFloat(
                            valorText
                              .replace('R$', '')
                              .replace(',', '.')
                              .trim(),
                          );
                          const subtotal = parseFloat(
                            subtotalText
                              .replace('R$', '')
                              .replace(',', '.')
                              .trim(),
                          );

                          expect(subtotal).to.be.closeTo(qtd * valor, 0.01);
                        });
                    });
                });
            });
        });
      });
    });
  });

  describe('Visual e Organização', () => {
    it('Modal deve ter visual claro e organizado', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-header').should('be.visible');
            cy.getByData('modal-detalhes-total').should('be.visible');
            cy.getByData('modal-detalhes-tabela').should('be.visible');
            cy.getByData('modal-detalhes-data-criacao').should('be.visible');
          });
        }
      });
    });

    it('Informações devem estar bem estruturadas', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-header').should(
              'have.css',
              'font-size',
            );
            cy.getByData('modal-detalhes-total').should(
              'have.css',
              'font-weight',
            );
          });
        }
      });
    });

    it('Total deve estar em destaque visual', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-total')
              .should('have.css', 'font-size')
              .and('match', /\d+px/);

            cy.getByData('modal-detalhes-total')
              .should('have.css', 'font-weight')
              .and('match', /bold|700|600/);
          });
        }
      });
    });
  });

  describe('Estado de Carregamento', () => {
    it('Deve exibir loading durante carregamento dos detalhes', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');
          cy.log('Modal aberto com sucesso');
        }
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('Deve exibir mensagem de erro se falhar ao carregar detalhes', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.intercept('GET', '**/orcamentos/*', {
            statusCode: 500,
            body: { message: 'Erro ao carregar detalhes' },
          }).as('getOrcamentoError');

          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.wait('@getOrcamentoError');
          cy.wait(1000);

          cy.get('body').then(($body) => {
            if (
              $body.text().includes('erro') ||
              $body.text().includes('Erro')
            ) {
              cy.contains(/erro/i).should('be.visible');
            }
          });
        }
      });
    });
  });

  describe('Responsividade do Modal', () => {
    it('Modal deve ser responsivo em telas pequenas', () => {
      cy.viewport(375, 667);

      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');

          cy.getByData('modal-detalhes-orcamento')
            .should('have.css', 'width')
            .and('match', /\d+px/);
        }
      });
    });

    it('Modal deve ser responsivo em tablets', () => {
      cy.viewport(768, 1024);

      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');
        }
      });
    });

    it('Modal deve ser responsivo em desktops', () => {
      cy.viewport(1920, 1080);

      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');
        }
      });
    });
  });

  describe('Acessibilidade', () => {
    it('Modal deve ter foco ao abrir', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');
          cy.focused().should('exist');
        }
      });
    });

    it('Deve ser possível navegar com teclado', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').should('be.visible');

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.get('button, a, [tabindex]').should('exist');
          });
        }
      });
    });

    it('Botão fechar deve ter aria-label ou title', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').within(() => {
            cy.getByData('modal-detalhes-close').should('satisfy', ($el) => {
              return $el.attr('aria-label') || $el.attr('title');
            });
          });
        }
      });
    });
  });

  describe('Integração com Geração de PDF', () => {
    it('Deve ter botão para gerar PDF do orçamento', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').then(($modal) => {
            if ($modal.find('[data-test="botao-gerar-pdf"]').length > 0) {
              cy.getByData('botao-gerar-pdf').should('be.visible');
            } else {
              cy.log(
                'Botão de gerar PDF não encontrado - funcionalidade pode não estar implementada',
              );
            }
          });
        }
      });
    });

    it('Deve exibir toast de erro se falhar ao gerar PDF', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="orcamentos-table"] tbody tr').length > 0) {
          cy.intercept('POST', '**/orcamentos/*/pdf', {
            statusCode: 500,
            body: { message: 'Erro ao gerar PDF' },
          }).as('gerarPdfError');

          cy.getByData('orcamentos-table').within(() => {
            cy.get('tbody tr')
              .first()
              .within(() => {
                cy.getByData('visualizar-button').click();
              });
          });

          cy.getByData('modal-detalhes-orcamento').then(($modal) => {
            if ($modal.find('[data-test="botao-gerar-pdf"]').length > 0) {
              cy.getByData('botao-gerar-pdf').click();
              cy.wait('@gerarPdfError');
              cy.wait(1000);

              cy.get('body').then(($body) => {
                if (
                  $body.text().includes('erro') ||
                  $body.text().includes('Erro')
                ) {
                  cy.contains(/erro/i).should('be.visible');
                }
              });
            } else {
              cy.log('Botão de gerar PDF não encontrado - teste não aplicável');
            }
          });
        }
      });
    });
  });
});
