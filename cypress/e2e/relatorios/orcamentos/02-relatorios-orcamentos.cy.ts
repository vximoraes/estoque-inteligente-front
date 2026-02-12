import path from "path";

describe('Tela de relatórios de orçamentos.', () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');
  let status = ["Em Estoque", "Baixo Estoque", "Indisponível"]

  beforeEach(() => {
    cy.visit(`${frontendUrl}/`)
    login(email, senha)
  })

  describe('Validação da Tabela', () => {
    it('Deve verificar se os cabeçalhos da tabela estão corretos.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()

      cy.get('[data-test="table-head-codigo"]').should('be.visible')
      cy.get('[data-test="table-head-nome"]').should('be.visible')
      cy.get('[data-test="table-head-descricao"]').should('be.visible')
      cy.get('[data-test="table-head-itens"]').should('be.visible')
      cy.get('[data-test="table-head-valor-total"]').should('be.visible')
      cy.get('[data-test="table-head-data"]').should('be.visible')

      cy.get('[data-test="table-head-codigo"]').should('contain.text', 'CÓDIGO')
      cy.get('[data-test="table-head-nome"]').should('contain.text', 'NOME')
      cy.get('[data-test="table-head-descricao"]').should('contain.text', 'DESCRIÇÃO')
      cy.get('[data-test="table-head-itens"]').should('contain.text', 'ITENS')
      cy.get('[data-test="table-head-valor-total"]').should('contain.text', 'VALOR TOTAL')
      cy.get('[data-test="table-head-data"]').should('contain.text', 'DATA')

      cy.get('[data-test="table-head-checkbox"]').should('be.visible')
      cy.get('[data-test="table-head-checkbox"]').find('input[type="checkbox"]').should('exist')
    })

    it('Deve verificar se os campos estão visíveis em todas as linhas e se a nomenclatura dos campos corresponde.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()

      cy.get('[data-test="orcamento-row"]').should('exist')
      cy.get('[data-test="orcamento-row"]').should('have.length.greaterThan', 0)

      cy.get('[data-test="orcamento-row"]').each((row) => {
        cy.wrap(row).within(() => {
          cy.get('[data-test="orcamento-codigo"]').should('be.visible')
          cy.get('[data-test="orcamento-nome"]').should('be.visible')
          cy.get('[data-test="orcamento-descricao"]').should('be.visible')
          cy.get('[data-test="orcamento-itens"]').should('be.visible')
          cy.get('[data-test="orcamento-valor-total"]').should('be.visible')
          cy.get('[data-test="orcamento-data"]').should('be.visible')
        })
      })
    })
  })

  describe('Funcionalidade de Checkboxes', () => {
    it('Deve verificar se os checkboxes são todos ativados/desativados quando o checkbox mãe passar por uma interação.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()

      cy.get('[data-test="orcamento-row"]').should('exist')
      cy.get('[data-test="orcamento-row"]').should('have.length.greaterThan', 0)

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

  describe('Busca de Orçamentos', () => {
    it('Deve pesquisar um orçamento pelo nome.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
      cy.get('[data-test="orcamento-row"]').first().find('[data-test="orcamento-nome"]').first().invoke('text').then((e) => {
        const nomeOrcamento = e.trim()
        cy.get('[data-test="search-input"]').type(nomeOrcamento)
        cy.wait(500)
        cy.get('[data-test="orcamento-row"]').each((orcamento_nome) => {
          const nome = orcamento_nome.find('[data-test="orcamento-nome"]').text().trim()
          expect(nomeOrcamento).to.eq(nome)
        })
      })
    })
  })

  describe('Estatísticas', () => {
    it('Deve verificar se as informações das estatísticas estão visíveis.', () => {
      cy.get('[data-test="sidebar-btn-relatorios"]').click()
      cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
      cy.wait(500)
      cy.get('[data-test="stat-total-orcamentos"]').within((e) => {
        const paragrafos = e.find('p')
        let texto = ''
        for (const p of paragrafos) {
          texto += p.textContent + " "
        }
        texto = texto.trim()
        if (texto) {
          expect(texto).contain('Total de orçamentos')
        }
      })

      cy.get('[data-test="stat-valor-total"]').within((e) => {
        const paragrafos = e.find('p')
        let texto = ''
        for (const p of paragrafos) {
          texto += p.textContent + " "
        }
        texto = texto.trim()
        if (texto) {
          expect(texto).contain('Valor total')
        }
      })

      cy.get('[data-test="stat-maior-orcamento"]').within((e) => {
        const paragrafos = e.find('p')
        let texto = ''
        for (const p of paragrafos) {
          texto += p.textContent + " "
        }
        texto = texto.trim()
        if (texto) {
          expect(texto).contain('Maior orçamento')
        }
      })

      cy.get('[data-test="stat-menor-orcamento"]').within((e) => {
        const paragrafos = e.find('p')
        let texto = ''
        for (const p of paragrafos) {
          texto += p.textContent + " "
        }
        texto = texto.trim()
        if (texto) {
          expect(texto).contain('Menor orçamento')
        }
      })
    })
  })

  describe('Filtros de Relatório', () => {
    it('Deve pesquisar por um valor x e retornar valores iguais ou maiores a este.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
    cy.get('[data-test="orcamento-row"]').first().find('[data-test="orcamento-valor-total"]').invoke('text').then((e) => {
      let valor = e.replace('R$', '').replace('R$', '').trim().replace('.', '').replace(',', '.')
      let valorNumerico = parseFloat(valor)
      cy.get('[data-test="filtros-button"]').click()
      cy.get('[data-test="filtro-valor-min-input"]').should('be.visible')
      cy.get('[data-test="filtro-valor-min-input"]').invoke('val').should('be.empty')
      cy.get('[data-test="filtro-valor-min-input"]').type(valor)
      cy.get('[data-test="aplicar-filtros-button"]').should('be.visible')
      cy.get('[data-test="aplicar-filtros-button"]').click()
      cy.wait(1000)
      cy.get('[data-test="orcamento-row"]').each((orcamento) => {
        let i_valor = orcamento.find('[data-test="orcamento-valor-total"]').text().replace('R$', '').trim().replace('.', '').replace(',', '.')
        let i_valorNumerico = parseFloat(i_valor)
        expect(i_valorNumerico).to.be.gte(valorNumerico)
      })
    })
  })

  it('Deve pesquisar por um valor x e retornar valores iguais ou menores a este.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
    cy.get('[data-test="orcamento-row"]').first().find('[data-test="orcamento-valor-total"]').invoke('text').then((e) => {
      let valor = e.replace('R$', '').replace('R$', '').trim().replace('.', '').replace(',', '.')
      let valorNumerico = parseFloat(valor)
      cy.get('[data-test="filtros-button"]').click()
      cy.get('[data-test="filtro-valor-max-input"]').should('be.visible')
      cy.get('[data-test="filtro-valor-max-input"').invoke('val').should('be.empty')
      cy.get('[data-test="filtro-valor-max-input"]').type(valor)
      cy.get('[data-test="aplicar-filtros-button"]').should('be.visible')
      cy.get('[data-test="aplicar-filtros-button"]').click()
      cy.wait(1000)
      cy.get('[data-test="orcamento-row"]').each((orcamento) => {
        let i_valor = orcamento.find('[data-test="orcamento-valor-total"]').text().replace('R$', '').trim().replace('.', '').replace(',', '.')
        let i_valorNumerico = parseFloat(i_valor)
        expect(i_valorNumerico).to.be.lte(valorNumerico)
      })
    })
  })

  it('Deve pesquisar pela Data inicial e os resultados devem serem iguais ou maiores a data selecionada.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
        cy.get('[data-test="orcamento-row"]').first().find('[data-test="orcamento-data"]').invoke('text').then((e) => {
          let data = e.split('/').reverse().join('-')
          const dataAlvo = new Date(data).getTime()
          cy.get('[data-test="filtros-button"]').should('be.visible').click()
          cy.get('[data-test="filtro-periodo-dropdown"]').click()
          cy.get('[data-test="filtro-periodo-option-personalizado"]').click()
          cy.get('[data-test="filtro-data-inicio-input"]').type(e.split('/').reverse().join('-'))
          cy.get('[data-test="aplicar-filtros-button"]').should('be.visible').click()
          cy.wait(500)
          cy.get('[data-test="filter-tag-data-inicio"]').should('be.visible').contains('span', e)
          cy.get('[data-test="orcamento-row"]').each((orcamento) => {
            let i_data = orcamento.find('[data-test="orcamento-data"]').text().split('/').reverse().join('-')
            const i_dataAlo = new Date(i_data).getTime()
            expect(i_dataAlo).to.be.gte(dataAlvo)
          })
          cy.wrap(null).then((e) => {
            cy.get('[data-test="remove-data-inicio-filter"]').click()
            cy.get('[data-test="applied-filters"]').should('not.exist', e)
          })
        })
  })

  it('Deve pesquisar pela Data final e os resultados devem serem iguais ou menores a data selecionada.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
        cy.get('[data-test="orcamento-row"]').first().find('[data-test="orcamento-data"]').invoke('text').then((e) => {
          let data = e.split('/').reverse().join('-')
          const dataAlvo = new Date(data).getTime()
          cy.get('[data-test="filtros-button"]').should('be.visible').click()
          cy.get('[data-test="filtro-periodo-dropdown"]').click()
          cy.get('[data-test="filtro-periodo-option-personalizado"]').click()
          cy.get('[data-test="filtro-data-fim-input"]').type(e.split('/').reverse().join('-'))
          cy.get('[data-test="aplicar-filtros-button"]').should('be.visible').click()
          cy.wait(500)
          cy.get('[data-test="filter-tag-data-fim"]').should('be.visible').contains('span', e)
          cy.get('[data-test="orcamento-row"]').each((orcamento) => {
            let i_data = orcamento.find('[data-test="orcamento-data"]').text().split('/').reverse().join('-')
            const i_dataAlo = new Date(i_data).getTime()
            expect(i_dataAlo).to.be.gte(dataAlvo)
          })
          cy.wrap(null).then((e) => {
            cy.get('[data-test="remove-data-fim-filter"]').click()
            cy.get('[data-test="applied-filters"]').should('not.exist', e)
          })
        })
  })

  it('Deve ajustar data futura para a data atual ao aplicar filtro.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
    cy.wait(500)

    const hoje = new Date()
    const year = hoje.getFullYear()
    const month = String(hoje.getMonth() + 1).padStart(2, '0')
    const day = String(hoje.getDate()).padStart(2, '0')
    const hojeFormatado = `${day}/${month}/${year}`
    
    const dataFutura = new Date()
    dataFutura.setDate(dataFutura.getDate() + 7)
    const futuroYear = dataFutura.getFullYear()
    const futuroMonth = String(dataFutura.getMonth() + 1).padStart(2, '0')
    const futuroDay = String(dataFutura.getDate()).padStart(2, '0')
    const dataFuturaInput = `${futuroYear}-${futuroMonth}-${futuroDay}`

    cy.get('[data-test="filtros-button"]').should('be.visible').click()
    cy.get('[data-test="filtro-periodo-dropdown"]').click()
    cy.get('[data-test="filtro-periodo-option-personalizado"]').click()
    
    cy.get('[data-test="filtro-data-inicio-input"]').type(dataFuturaInput)
    cy.get('[data-test="aplicar-filtros-button"]').should('be.visible').click()
    cy.wait(500)
    
    cy.get('[data-test="filter-tag-data-inicio"]').should('be.visible').contains('span', hojeFormatado)
    
    cy.get('[data-test="remove-data-inicio-filter"]').click()
  })

  it('Deve ajustar data final para data inicial quando data final for menor que data inicial.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
    cy.wait(500)

    const hoje = new Date()
    const year = hoje.getFullYear()
    const month = String(hoje.getMonth() + 1).padStart(2, '0')
    const day = String(hoje.getDate()).padStart(2, '0')
    const hojeInput = `${year}-${month}-${day}`
    const hojeFormatado = `${day}/${month}/${year}`
    
    const dataPassada = new Date()
    dataPassada.setDate(dataPassada.getDate() - 5)
    const passadoYear = dataPassada.getFullYear()
    const passadoMonth = String(dataPassada.getMonth() + 1).padStart(2, '0')
    const passadoDay = String(dataPassada.getDate()).padStart(2, '0')
    const dataPassadaInput = `${passadoYear}-${passadoMonth}-${passadoDay}`

    cy.get('[data-test="filtros-button"]').should('be.visible').click()
    cy.get('[data-test="filtro-periodo-dropdown"]').click()
    cy.get('[data-test="filtro-periodo-option-personalizado"]').click()
    
    cy.get('[data-test="filtro-data-inicio-input"]').type(hojeInput)
    cy.get('[data-test="filtro-data-fim-input"]').type(dataPassadaInput)
    
    cy.get('[data-test="aplicar-filtros-button"]').should('be.visible').click()
    cy.wait(500)
    
    cy.get('[data-test="filter-tag-data-inicio"]').should('be.visible').contains('span', hojeFormatado)
    cy.get('[data-test="filter-tag-data-fim"]').should('be.visible').contains('span', hojeFormatado)
    
    cy.get('[data-test="remove-data-inicio-filter"]').click()
    cy.get('[data-test="remove-data-fim-filter"]').click()
  })

  it('Deve ajustar ambas as datas futuras para hoje e depois ajustar data final se necessário.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
    cy.wait(500)

    const hoje = new Date()
    const year = hoje.getFullYear()
    const month = String(hoje.getMonth() + 1).padStart(2, '0')
    const day = String(hoje.getDate()).padStart(2, '0')
    const hojeFormatado = `${day}/${month}/${year}`
    
    const dataFuturaInicio = new Date()
    dataFuturaInicio.setDate(dataFuturaInicio.getDate() + 10)
    const inicioYear = dataFuturaInicio.getFullYear()
    const inicioMonth = String(dataFuturaInicio.getMonth() + 1).padStart(2, '0')
    const inicioDay = String(dataFuturaInicio.getDate()).padStart(2, '0')
    const dataFuturaInicioInput = `${inicioYear}-${inicioMonth}-${inicioDay}`
    
    const dataFuturaFim = new Date()
    dataFuturaFim.setDate(dataFuturaFim.getDate() + 5)
    const fimYear = dataFuturaFim.getFullYear()
    const fimMonth = String(dataFuturaFim.getMonth() + 1).padStart(2, '0')
    const fimDay = String(dataFuturaFim.getDate()).padStart(2, '0')
    const dataFuturaFimInput = `${fimYear}-${fimMonth}-${fimDay}`

    cy.get('[data-test="filtros-button"]').should('be.visible').click()
    cy.get('[data-test="filtro-periodo-dropdown"]').click()
    cy.get('[data-test="filtro-periodo-option-personalizado"]').click()
    
    cy.get('[data-test="filtro-data-inicio-input"]').type(dataFuturaInicioInput)
    cy.get('[data-test="filtro-data-fim-input"]').type(dataFuturaFimInput)
    
    cy.get('[data-test="aplicar-filtros-button"]').should('be.visible').click()
    cy.wait(500)
    
    cy.get('[data-test="filter-tag-data-inicio"]').should('be.visible').contains('span', hojeFormatado)
    cy.get('[data-test="filter-tag-data-fim"]').should('be.visible').contains('span', hojeFormatado)
    
    cy.get('[data-test="remove-data-inicio-filter"]').click()
    cy.get('[data-test="remove-data-fim-filter"]').click()
  })
  })

  describe('Exportação de Relatórios', () => {
    it('Botão de Exportar deve estar sem interação se nenhum orçamento com checkbox selecionada estiver presente.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
    cy.get('[data-test="exportar-button"]').should('not.be.enabled')
    cy.get('[data-test="checkbox-select-item"]').first().click()
  })

  it('Botão de Exportar deve estar interativo se ao menos um orçamento estiver selecionado.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
    cy.get('[data-test="checkbox-select-item"]').first().click()
    cy.get('[data-test="exportar-button"]').should('be.enabled')
  })

  it('Não deve Exportar um .pdf se o campo nome estiver vazio.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
    cy.get('[data-test="checkbox-select-item"]').first().click()
    cy.get('[data-test="exportar-button"]').click()
    cy.get('[data-test="modal-exportar-content"]').should('be.visible')
    cy.get('[data-test="filename-input"]').clear()
    cy.get('[data-test="format-radio-pdf"]').check().should('be.checked')
    cy.get('[data-test="modal-exportar-export-button"]').should('not.be.enabled')
  })

  it('Não deve exportar um .csv se o campo nome estiver vazio.', () => {
    cy.get('[data-test="sidebar-btn-relatorios"]').click()
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
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
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
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
    cy.get('[data-test="sidebar-btn-relatorios-subitem-orçamentos"]').click()
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
