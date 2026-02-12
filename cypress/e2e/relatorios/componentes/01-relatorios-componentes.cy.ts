import path from 'path'

describe('Tela de relatórios de componentes.', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');
  let status = ["Em Estoque", "Baixo Estoque", "Indisponível"]

  beforeEach(() => {
    cy.visit(`${frontendUrl}/`)
    login(email, senha)
  })

  describe('Validação da Tabela', () => {
    it('Deve verificar se os cabeçalhos da tabela estão corretos', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()

      cy.get('[data-test="table-head-codigo"]').should('be.visible')
      cy.get('[data-test="table-head-componente"]').should('be.visible')
      cy.get('[data-test="table-head-quantidade"]').should('be.visible')
      cy.get('[data-test="table-head-status"]').should('be.visible')
      cy.get('[data-test="table-head-localizacao"]').should('be.visible')

      cy.get('[data-test="table-head-codigo"]').should('contain.text', 'CÓDIGO')
      cy.get('[data-test="table-head-componente"]').should('contain.text', 'COMPONENTE')
      cy.get('[data-test="table-head-quantidade"]').should('contain.text', 'QUANTIDADE')
      cy.get('[data-test="table-head-status"]').should('contain.text', 'STATUS')
      cy.get('[data-test="table-head-localizacao"]').should('contain.text', 'LOCALIZAÇÃO')

      cy.get('[data-test="table-head-checkbox"]').should('be.visible')
      cy.get('[data-test="table-head-checkbox"]').find('input[type="checkbox"]').should('exist')
    })

    it('Deve verificar se os campos estão visíveis em todas as linhas e se a nomenclatura dos campos corresponde.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()

      cy.get('[data-test="componente-row"]').should('exist')
      cy.get('[data-test="componente-row"]').should('have.length.greaterThan', 0)

      cy.get('[data-test="componente-row"]').each((row) => {
        cy.wrap(row).within(() => {
          cy.get('[data-test="componente-codigo"]').should('be.visible')
          cy.get('[data-test="componente-nome"]').should('be.visible')
          cy.get('[data-test="componente-quantidade"]').should('be.visible')
          cy.get('[data-test="componente-localizacao"]').should('be.visible')
        })
      })
    })
  })

  describe('Funcionalidade de Checkboxes', () => {
    it('Deve verificar se os checkboxes são todos ativados/desativados quando o checkbox mãe passar por uma interação.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()

      cy.get('[data-test="componente-row"]').should('exist')
      cy.get('[data-test="componente-row"]').should('have.length.greaterThan', 0)

      cy.get('[data-test="checkbox-select-item"]').each((checkbox) => {
        cy.wrap(checkbox).should('not.be.checked')
      })

      cy.get('[data-test="checkbox-select-all"]').should('not.be.checked')
      cy.get('[data-test="checkbox-select-all"]').click()
      cy.get('[data-test="checkbox-select-all"]').should('be.checked')

      cy.get('[data-test="checkbox-select-item"]').each((checkbox) => {
        cy.wrap(checkbox).should('be.checked')
      })

      cy.wrap(null).then(() => {
        cy.get('[data-test="checkbox-select-all"]').click({ force: true })
        cy.get('[data-test="checkbox-select-all"]').should('not.be.checked')
        cy.get('[data-test="checkbox-select-item"]').each((checkbox) => {
          cy.wrap(checkbox).should('not.be.checked')
        })
      })
    })
  })

  describe('Filtros de Relatório', () => {
    it('Deve realizar uma pesquisa pelo filtro baseado no status.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()

      cy.get('[data-test="componente-status"]').first().invoke('text').then((e) => {
        if (status.includes(e)) {
          cy.get('[data-test="filtros-button"]').should('be.visible')
          cy.get('[data-test="filtros-button"]').click()
          cy.get('[data-test="filtro-status-dropdown"]').should('be.visible')
          cy.get('[data-test="filtro-status-dropdown"]').click()
          cy.get('[data-test="filtro-status-dropdown"]').parent().find('div').first().contains('button', `${e}`).should('be.visible')
          cy.get('[data-test="filtro-status-dropdown"]').parent().find('div').first().contains('button', `${e}`).click()
          cy.get('[data-test="aplicar-filtros-button"]').should('be.visible')
          cy.get('[data-test="aplicar-filtros-button"]').click()
          cy.wait(500)
          cy.get('[data-test="componente-row"]').each((produto_status) => {
            const statusAtual = produto_status.find('[data-test="componente-status"]').text()
            expect(statusAtual).to.eq(e)
          })
          cy.get('[data-test="filter-tag-status"]').contains(e)
        } else {
          cy.log('Não há produtos cadastrados.')
          return
        }
      })
    })

    it('Deve realizar uma pesquisa pelo filtro baseado na categoria.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()
      cy.get('[data-test="filtros-button"]').should('be.visible')
      cy.get('[data-test="filtros-button"]').click()
      cy.get('[data-test="filtro-categoria-dropdown"]').should('be.visible')
      cy.get('[data-test="filtro-categoria-dropdown"]').click()
      cy.get('[data-test="filtro-categoria-dropdown"]').parent().find('div').first().find('button').then((e) => {
        const cabos = e.get()[1].textContent
        cy.contains(cabos).should('be.visible')
        cy.contains(cabos).click()
        cy.get('[data-test="aplicar-filtros-button"]').should('be.visible')
        cy.get('[data-test="aplicar-filtros-button"]').click()
        cy.get('[data-test="componente-row"]').should('exist')
        cy.get('[data-test="componente-row"]').should('be.visible')
        cy.get('[data-test="filter-tag-categoria"]').contains(cabos)
      })
    })
  })

  describe('Estatísticas', () => {
    it('Deve verificar se as informações das estatísticas estão visíveis.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()
      cy.wait(500)
      cy.get('[data-test="stat-total-componentes"]').within((e) => {
        const paragrafos = e.find('p')
        let texto = ''
        for (const p of paragrafos) {
          texto += p.textContent + " "
        }
        texto = texto.trim()
        if (texto) {
          expect(texto).contain('Total de componentes')
        }
      })

      cy.get('[data-test="stat-em-estoque"]').within((e) => {
        const paragrafos = e.find('p')
        let texto = ''
        for (const p of paragrafos) {
          texto += p.textContent + " "
        }
        texto = texto.trim()
        if (texto) {
          expect(texto).contain('Em estoque')
        }
      })

      cy.get('[data-test="stat-baixo-estoque"]').within((e) => {
        const paragrafos = e.find('p')
        let texto = ''
        for (const p of paragrafos) {
          texto += p.textContent + " "
        }
        texto = texto.trim()
        if (texto) {
          expect(texto).contain('Baixo estoque')
        }
      })

      cy.get('[data-test="stat-indisponiveis"]').within((e) => {
        const paragrafos = e.find('p')
        let texto = ''
        for (const p of paragrafos) {
          texto += p.textContent + " "
        }
        texto = texto.trim()
        if (texto) {
          expect(texto).contain('Indisponível')
        }
      })
    })
  })

  describe('Busca de Componentes', () => {
    it('Deve pesquisar um componente pelo nome.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()
      cy.get('[data-test="componente-row"]').first().find('[data-test="componente-nome"]').first().invoke('text').then((e) => {
        cy.get('[data-test="search-input"]').type(e)
        cy.wait(500)
        cy.get('[data-test="componente-row"]').each((componente_nome) => {
          const nome = componente_nome.find('[data-test="componente-nome"]').text()
          expect(e).to.eq(nome)
        })
      })
    })
  })

  describe('Exportação de Relatórios', () => {
    it('Botão de Exportar deve estar sem interação se nenhum componente com checkbox seletada estiver presente.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()
      cy.get('[data-test="exportar-button"]').should('not.be.enabled')
      cy.get('[data-test="checkbox-select-item"]').first().click()
    })

    it('Botão de Exportar deve estar interativo se ao menos um componente estiver selecionado.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()
      cy.get('[data-test="checkbox-select-item"]').first().click()
      cy.get('[data-test="exportar-button"]').should('be.enabled')
    })

    it('Não deve Exportar um .pdf se o campo nome estiver vazio.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()
      cy.get('[data-test="checkbox-select-item"]').first().click()
      cy.get('[data-test="exportar-button"]').click()
      cy.get('[data-test="modal-exportar-content"]').should('be.visible')
      cy.get('[data-test="filename-input"]').clear()
      cy.get('[data-test="format-radio-pdf"]').check().should('be.checked')
      cy.get('[data-test="modal-exportar-export-button"]').should('not.be.enabled')
    })

    it('Não deve exportar um .csv se o campo nome estiver vazio.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()
      cy.get('[data-test="checkbox-select-item"]').first().click()
      cy.get('[data-test="exportar-button"]').click()
      cy.get('[data-test="modal-exportar-content"]').should('be.visible')
      cy.get('[data-test="filename-input"]').clear()
      cy.get('[data-test="format-radio-csv"]').click()
      cy.get('[data-test="format-radio-csv"]').check().should('be.checked')
      cy.get('[data-test="modal-exportar-export-button"]').should('not.be.enabled')
    })

    it('Deve exportar um pdf com sucesso.', () => {
      const date = new Date().getTime()
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`

      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()
      cy.get('[data-test="checkbox-select-item"]').first().click()
      cy.get('[data-test="exportar-button"]').click()
      cy.get('[data-test="format-radio-pdf"]').check().should('be.checked')
      cy.get('[data-test="filename-input"]').clear().type(date.toString())
      cy.wait(1000)
      cy.get('[data-test="modal-exportar-export-button"]').should('be.visible')
      cy.get('[data-test="modal-exportar-export-button"]').click()
      const filePath = path.join(Cypress.config('downloadsFolder'), `${date.toString()}-${dateString}.pdf`)
      cy.readFile(filePath).should('exist')
    })

    it('Deve exportar um csv com sucesso.', () => {
      const date = new Date().getTime()
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`

      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-componentes"]').click()
      cy.get('[data-test="checkbox-select-item"]').first().click()
      cy.get('[data-test="exportar-button"]').click()
      cy.get('[data-test="format-radio-csv"]').check().should('be.checked')
      cy.get('[data-test="filename-input"]').clear().type(date.toString())
      cy.wait(1000)
      cy.get('[data-test="modal-exportar-export-button"]').should('be.visible')
      cy.get('[data-test="modal-exportar-export-button"]').click()
      const filePath = path.join(Cypress.config('downloadsFolder'), `${date.toString()}-${dateString}.csv`)
      cy.readFile(filePath).should('exist')
    })
  })
})

function login(email: string, senha: string) {
  cy.get('#email').type(email)
  cy.get("#senha").type(senha)
  cy.get('button').contains('Entrar').click()
}
