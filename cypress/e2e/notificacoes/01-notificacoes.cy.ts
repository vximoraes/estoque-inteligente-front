describe('Notificações.', () => {
    const frontendUrl = Cypress.env('FRONTEND_URL');
    const email = Cypress.env('TEST_USER_EMAIL');
    const senha = Cypress.env('TEST_USER_PASSWORD');
    let item = "Componente Teste Notificações"
    let min = 5
    let status = ["Em Estoque", "Baixo Estoque", "Indisponível"]
    beforeEach(() => {
        cy.visit(`${frontendUrl}/`)
        login(email, senha)
    })

    it('Deve cadastrar um item e verificar se uma nova notificação correspondente é criada', () => {
        cy.get('[data-test="search-input"]').type(item)
        cy.wait(1500)
        cy.get('[data-test="stat-total-itens"]').find('p').invoke('text').then((e) => {
            let total = parseInt(e.replace(/\D/g, ''))
            if (total == 0) {
                cy.get('[data-test="adicionar-button"]').click()
                cy.get('[data-test="input-nome-item"]').type(item)
                cy.get('[data-test="botao-selecionar-categoria"]').click()
                cy.get('[title="Cabos"]').click()
                cy.get('[data-test="input-estoque-minimo"]').clear().type(min.toString())
                cy.get('[data-test="textarea-descricao-item"]').type('Notificações teste...')
                cy.get('[data-test="botao-salvar"]').click()
                cy.wait(1500)
                cy.get('[data-test="search-input"]').clear().type(item)
                cy.wait(1000)
            }

            // Gerar entrada para criar notificação
            cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
            cy.get('[data-test="modal-entrada-quantidade-input"]').type('10')
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').click()
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').parent().find('button:not([data-test="modal-entrada-localizacao-dropdown"])').first().click()
            cy.get('[data-test="modal-entrada-confirmar"]').click()
            cy.wait(2000)

            // Verificar notificações
            cy.get('[data-test="botao-notificacoes"]').click()
            cy.get('[data-test="item-notificacao"]').should('have.length.at.least', 1)
        })
    })

    it('Deve averiguar a mensagem sobre o status do último item.', () => {
        let quantidade = ""
        cy.get('[data-test="search-input"]').type(item)
        cy.wait(1500)
        cy.get('[data-test="stat-total-itens"]').find('p').invoke('text').then((e) => {
            let total = parseInt(e.replace(/\D/g, ''))
            if (total == 0) {
                cy.get('[data-test="adicionar-button"]').click()
                cy.get('[data-test="input-nome-item"]').type(item)
                cy.get('[data-test="botao-selecionar-categoria"]').click()
                cy.get('[title="Cabos"]').click()
                cy.get('[data-test="input-estoque-minimo"]').clear().type(min.toString())
                cy.get('[data-test="textarea-descricao-item"]').type('Notificações teste...')
                cy.get('[data-test="botao-salvar"]').click()
                cy.wait(1500)
                cy.get('[data-test="search-input"]').clear().type(item)
                cy.wait(1000)
            }

            // Obter quantidade atual e status inicial
            cy.get('[data-test="item-card-0"]').find('[data-test="quantity"]').find('span').first().invoke('text').then((qtdTextoInicial) => {
                let qtdInicial = parseInt(qtdTextoInicial.replaceAll(/\D/g, ''))
                cy.log(`Quantidade inicial: ${qtdInicial}`)
                
                // Determinar status inicial baseado na quantidade
                let statusInicial = qtdInicial >= min ? "Em Estoque" : (qtdInicial > 0 ? "Baixo Estoque" : "Indisponível")
                cy.log(`Status inicial: ${statusInicial}`)
                
                // Gerar movimentação que MUDE o status
                let movimentacao = 0
                if (statusInicial === "Em Estoque") {
                    // Se está Em Estoque (>=5), fazer saída para Baixo Estoque (deixar com 2)
                    movimentacao = qtdInicial - 2
                    cy.get('[data-test="item-card-0"]').find('[data-test="saida-icon"]').click()
                    cy.get('[data-test="modal-saida-quantidade-input"]').type(movimentacao.toString())
                } else if (statusInicial === "Baixo Estoque") {
                    // Se está Baixo Estoque (1-4), fazer entrada para Em Estoque (adicionar até 10)
                    movimentacao = 10 - qtdInicial
                    cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
                    cy.get('[data-test="modal-entrada-quantidade-input"]').type(movimentacao.toString())
                } else {
                    // Se está Indisponível (0), fazer entrada para Baixo Estoque (adicionar 2)
                    movimentacao = 2
                    cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
                    cy.get('[data-test="modal-entrada-quantidade-input"]').type(movimentacao.toString())
                }
                
                cy.get('[data-test="modal-entrada-localizacao-dropdown"], [data-test="modal-saida-localizacao-dropdown"]').click()
                cy.get('[data-test="modal-entrada-localizacao-dropdown"], [data-test="modal-saida-localizacao-dropdown"]').parent().find('button:not([data-test="modal-entrada-localizacao-dropdown"]):not([data-test="modal-saida-localizacao-dropdown"])').first().click()
                cy.get('[data-test="modal-entrada-confirmar"], [data-test="modal-saida-confirmar"]').click()
                cy.wait(2000)

                // Obter quantidade e status atualizados
                cy.get('[data-test="search-input"]').clear().type(item)
                cy.wait(1000)
                cy.get('[data-test="quantity"]').find('span').first().invoke('text').then((e) => {
                    quantidade = e.replaceAll(/\D/g, '')
                    cy.log(`Quantidade após movimentação: ${quantidade}`)
                    
                    cy.get('[data-test="item-card-0"]').find('[data-test="status-badge"]').first().invoke('text').then((e) => {
                        cy.log(`Status após movimentação: ${e}`)
                        cy.get('[data-test="botao-notificacoes"]').click()
                        cy.wait(2000)
                        cy.get('[data-test="mensagem-notificacao"]').first().invoke('text').then((notificacao) => {
                            if (e === "Em Estoque") {
                                expect(notificacao).to.eq(`${item} está em estoque (${quantidade} unidades)`)
                            } else if (e === "Baixo Estoque") {
                                expect(notificacao).to.eq(`${item} está com estoque baixo (${quantidade} unidades)`)
                            } else if (e === "Indisponível") {
                                expect(notificacao).to.eq(`${item} está indisponível (${quantidade} unidades)`)
                            }
                        })
                    })
                })
            })
        })
    })

    it('Deve verificar marcar um teste como visto.', () => {
        cy.get('[data-test="search-input"]').type(item)
        cy.wait(1500)
        cy.get('[data-test="stat-total-itens"]').find('p').invoke('text').then((e) => {
            let total = parseInt(e.replace(/\D/g, ''))
            if (total == 0) {
                cy.get('[data-test="adicionar-button"]').click()
                cy.get('[data-test="input-nome-item"]').type(item)
                cy.get('[data-test="botao-selecionar-categoria"]').click()
                cy.get('[title="Cabos"]').click()
                cy.get('[data-test="input-estoque-minimo"]').clear().type(min.toString())
                cy.get('[data-test="textarea-descricao-item"]').type('Notificações teste...')
                cy.get('[data-test="botao-salvar"]').click()
                cy.wait(1500)
                cy.get('[data-test="search-input"]').clear().type(item)
                cy.wait(1000)
                cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
                cy.get('[data-test="modal-entrada-quantidade-input"]').type(min.toString())
                cy.get('[data-test="modal-entrada-localizacao-dropdown"]').click()
                cy.get('[data-test="modal-entrada-localizacao-dropdown"]').parent().find('button:not([data-test="modal-entrada-localizacao-dropdown"])').first().click()
                cy.get('[data-test="modal-entrada-confirmar"]').click()
                cy.wait(1000)
                cy.get('[data-test="botao-notificacoes"]').click()
                cy.get('[data-test="item-notificacao"]').first().then((e) => {
                    const visualizacao = e.find('[data-test="indicador-nao-lida"]')
                    //   cy.log(visualizacao.text())
                })
            } else {
                
                cy.get('[data-test="search-input"]').clear().type(item)
                cy.wait(1000)
                cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
                cy.get('[data-test="modal-entrada-quantidade-input"]').type('1')
                cy.get('[data-test="modal-entrada-localizacao-dropdown"]').click()
                cy.get('[data-test="modal-entrada-localizacao-dropdown"]').parent().find('button:not([data-test="modal-entrada-localizacao-dropdown"])').first().click()
                cy.get('[data-test="modal-entrada-confirmar"]').click()
                cy.wait(1000)
                cy.log('Componente já cadastrado.')

                cy.wrap(null).then(() => {
                    cy.wrap(null).then(() => {
                        cy.get('[data-test="botao-notificacoes"]').click()
                        cy.get('[data-test="item-notificacao"]').first().then((e) => {
                            const visualizacao = e.find('[data-test="indicador-nao-lida"]').first()
                            if(visualizacao){
                                // Caso complexo ele e click em cima de um div que tem que ser deletada
                                // Dai realiza a busca pela primeira div, garantindo que não é a mesma
                                // Baseando-se nisso certifica-se que ela realmete foi deletada.
                                visualizacao.trigger('click')
                                const item = e.parent().find('div').first()
                                expect(visualizacao).not.eq(item)
                            }
                            
                        })
                    })

                })

            }
        })
    })

    it('Deve marcar todas as notificações como visualizadas.', () => {
        cy.get('[data-test="search-input"]').type(item)
        cy.wait(1500)
        cy.get('[data-test="stat-total-itens"]').find('p').invoke('text').then((e) => {
            let total = parseInt(e.replace(/\D/g, ''))
            if (total == 0) {
                // Criar item
                cy.get('[data-test="adicionar-button"]').click()
                cy.get('[data-test="input-nome-item"]').type(item)
                cy.get('[data-test="botao-selecionar-categoria"]').click()
                cy.get('[title="Cabos"]').click()
                cy.get('[data-test="input-estoque-minimo"]').clear().type(min.toString())
                cy.get('[data-test="textarea-descricao-item"]').type('Notificações teste...')
                cy.get('[data-test="botao-salvar"]').click()
                cy.wait(1500)
                cy.get('[data-test="search-input"]').clear().type(item)
                cy.wait(1000)
            }

            // Obter quantidade atual para primeira movimentação - Em Estoque
            cy.get('[data-test="quantity"]').find('span').first().invoke('text').then((quantidadeTexto) => {
                let qtdAtual = parseInt(quantidadeTexto.replaceAll(/\D/g, ''))
                cy.log(`Quantidade atual inicial: ${qtdAtual}`)

                // Zerar estoque primeiro se necessário
                if (qtdAtual > 0) {
                    cy.get('[data-test="item-card-0"]').find('[data-test="saida-icon"]').click()
                    cy.get('[data-test="modal-saida-quantidade-input"]').type(qtdAtual.toString())
                    cy.get('[data-test="modal-saida-localizacao-dropdown"]').click()
                    cy.get('[data-test="modal-saida-localizacao-dropdown"]').parent().find('button:not([data-test="modal-saida-localizacao-dropdown"])').first().click()
                    cy.get('[data-test="modal-saida-confirmar"]').click()
                    cy.wait(2000)
                }

                // Primeira entrada - estoque alto (Em Estoque) - valor acima do mínimo
                cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
                cy.get('[data-test="modal-entrada-quantidade-input"]').type('15')
                cy.get('[data-test="modal-entrada-localizacao-dropdown"]').click()
                cy.get('[data-test="modal-entrada-localizacao-dropdown"]').parent().find('button:not([data-test="modal-entrada-localizacao-dropdown"])').first().click()
                cy.get('[data-test="modal-entrada-confirmar"]').click()
                cy.wait(2000)

                // Obter quantidade atual para segunda movimentação - Baixo Estoque
                cy.get('[data-test="quantity"]').find('span').first().invoke('text').then((qtdTexto2) => {
                    let qtdAtual2 = parseInt(qtdTexto2.replaceAll(/\D/g, ''))
                    cy.log(`Quantidade após entrada: ${qtdAtual2}`)

                    // Calcular saída para deixar entre 1 e min-1 (Baixo Estoque)
                    let saidaBaixoEstoque = qtdAtual2 - 3 // Vai ficar com 3 (1 <= 3 <= 4)
                    cy.get('[data-test="item-card-0"]').find('[data-test="saida-icon"]').click()
                    cy.get('[data-test="modal-saida-quantidade-input"]').type(saidaBaixoEstoque.toString())
                    cy.get('[data-test="modal-saida-localizacao-dropdown"]').click()
                    cy.get('[data-test="modal-saida-localizacao-dropdown"]').parent().find('button:not([data-test="modal-saida-localizacao-dropdown"])').first().click()
                    cy.get('[data-test="modal-saida-confirmar"]').click()
                    cy.wait(2000)

                    // Obter quantidade atual para terceira movimentação - Indisponível
                    cy.get('[data-test="quantity"]').find('span').first().invoke('text').then((qtdTexto3) => {
                        let qtdAtual3 = parseInt(qtdTexto3.replaceAll(/\D/g, ''))
                        cy.log(`Quantidade após primeira saída: ${qtdAtual3}`)

                        // Saída total para ficar com 0 (Indisponível)
                        cy.get('[data-test="item-card-0"]').find('[data-test="saida-icon"]').click()
                        cy.get('[data-test="modal-saida-quantidade-input"]').type(qtdAtual3.toString())
                        cy.get('[data-test="modal-saida-localizacao-dropdown"]').click()
                        cy.get('[data-test="modal-saida-localizacao-dropdown"]').parent().find('button:not([data-test="modal-saida-localizacao-dropdown"])').first().click()
                        cy.get('[data-test="modal-saida-confirmar"]').click()
                        cy.wait(3000)

                        // Abrir notificações e verificar indicadores não lidos
                        cy.get('[data-test="botao-notificacoes"]').click({ force: true })
                        cy.wait(1000)
                        
                        // Verificar que existem PELO MENOS 2 notificações não lidas (não necessariamente todas)
                        cy.get('[data-test="indicador-nao-lida"]').should('have.length.at.least', 2)

                        // Clicar em "Marcar todas como visualizadas"
                        cy.get('[data-test="botao-marcar-todas-visualizadas"]').click()
                        cy.wait(2000)

                        // Verificar que nenhuma notificação tem mais o indicador de não lida
                        cy.get('[data-test="indicador-nao-lida"]').should('not.exist')
                    })
                })
            })
        })
    })
})

function login(email: string, senha: string) {
    cy.get('#email').type(email)
    cy.get("#senha").type(senha)
    cy.get('button').contains('Entrar').click()
}

function gerarNotificacao(min: number) {
    let valor = 0
    cy.get('[data-test="contador-notificacoes"]').invoke('text').then((e) => {
        valor = parseInt(e.replaceAll(/\D/g, ''))
    })
    cy.get('[data-test="quantity"]').find('span').first().invoke('text').then((e) => {
        let qtd = parseInt(e.replaceAll(/\D/g, ''))
        cy.log(qtd.toString())
        if (qtd > min) {
            cy.get('[data-test="item-card-0"]').find('[data-test="saida-icon"]').click()
            cy.get('[data-test="modal-saida-quantidade-input"]').type(qtd.toString())
            cy.get('[data-test="modal-saida-localizacao-dropdown"]').click()
            cy.get('[data-test="modal-saida-localizacao-dropdown"]').parent().find('button:not([data-test="modal-saida-localizacao-dropdown"])').first().click()
            cy.get('[data-test="modal-saida-confirmar"]').click()
            cy.get('[data-test="botao-notificacoes"]').click()
            compararValor(valor)
        } else if (qtd < min) {
            let valor = min - qtd
            cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
            cy.get('[data-test="modal-entrada-quantidade-input"]').type(valor.toString())
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').click()
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').parent().find('button:not([data-test="modal-entrada-localizacao-dropdown"])').first().click()
            cy.get('[data-test="modal-entrada-confirmar"]').click()
            cy.get('[data-test="botao-notificacoes"]').click()
            compararValor(valor)
        }
        else if (qtd == 0) {
            cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
            cy.get('[data-test="modal-entrada-quantidade-input"]').type(min.toString())
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').click()
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').parent().find('button:not([data-test="modal-entrada-localizacao-dropdown"])').first().click()
            cy.get('[data-test="modal-entrada-confirmar"]').click()
            cy.get('[data-test="botao-notificacoes"]').click()
            compararValor(valor)
        }
        else {
            let valor = min - 1
            cy.get('[data-test="item-card-0"]').find('[data-test="saida-icon"]').click()
            cy.get('[data-test="modal-saida-quantidade-input"]').type(valor.toString())
            cy.get('[data-test="modal-saida-localizacao-dropdown"]').click()
            cy.get('[data-test="modal-saida-localizacao-dropdown"]').parent().find('button:not([data-test="modal-saida-localizacao-dropdown"])').first().click()
            cy.get('[data-test="modal-saida-confirmar"]').click()
            cy.get('[data-test="botao-notificacoes"]').click()
            compararValor(valor)
        }
    })
}

function gerarNotificacaoDois(min: number) {
    let valor = 0
    cy.get('[data-test="contador-notificacoes"]').invoke('text').then((e) => {
        valor = parseInt(e.replaceAll(/\D/g, ''))
    })
    cy.get('[data-test="quantity"]').find('span').first().invoke('text').then((e) => {
        let qtd = parseInt(e.replaceAll(/\D/g, ''))
        cy.log(qtd.toString())
        if (qtd > min) {
            cy.get('[data-test="item-card-0"]').find('[data-test="saida-icon"]').click()
            cy.get('[data-test="modal-saida-quantidade-input"]').type(qtd.toString())
            cy.get('[data-test="modal-saida-localizacao-dropdown"]').click()
            cy.get('[data-test="modal-saida-localizacao-dropdown"]').parent().find('button:not([data-test="modal-saida-localizacao-dropdown"])').first().click()
            cy.get('[data-test="modal-saida-confirmar"]').click()
            cy.get('[data-test="botao-notificacoes"]').click()
      
        } else if (qtd < min) {
            let valor = min - qtd
            cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
            cy.get('[data-test="modal-entrada-quantidade-input"]').type(valor.toString())
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').click()
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').parent().find('button:not([data-test="modal-entrada-localizacao-dropdown"])').first().click()
            cy.get('[data-test="modal-entrada-confirmar"]').click()
            cy.get('[data-test="botao-notificacoes"]').click()
         
        }
        else if (qtd == 0) {
            cy.get('[data-test="item-card-0"]').find('[data-test="entrada-icon"]').click()
            cy.get('[data-test="modal-entrada-quantidade-input"]').type(min.toString())
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').click()
            cy.get('[data-test="modal-entrada-localizacao-dropdown"]').parent().find('button:not([data-test="modal-entrada-localizacao-dropdown"])').first().click()
            cy.get('[data-test="modal-entrada-confirmar"]').click()
            cy.get('[data-test="botao-notificacoes"]').click()
 
        }
        else {
            let valor = min - 1
            cy.get('[data-test="item-card-0"]').find('[data-test="saida-icon"]').click()
            cy.get('[data-test="modal-saida-quantidade-input"]').type(valor.toString())
            cy.get('[data-test="modal-saida-localizacao-dropdown"]').click()
            cy.get('[data-test="modal-saida-localizacao-dropdown"]').parent().find('button:not([data-test="modal-saida-localizacao-dropdown"])').first().click()
            cy.get('[data-test="modal-saida-confirmar"]').click()
            cy.get('[data-test="botao-notificacoes"]').click()

        }
    })
}

function compararValor(valor: number) {
    let valorInterno = 0
    cy.get('[data-test="contador-notificacoes"]').invoke('text').then((e) => {
        valorInterno = parseInt(e.replaceAll(/\D/g, ''))
        expect(valor).to.lte(valorInterno)
        return
    })
}
