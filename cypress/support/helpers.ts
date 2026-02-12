export const generateUniqueComponentName = (prefix = 'Componente Teste'): string => {
  return `${prefix} ${Date.now()}`;
};

export const waitForElementToDisappear = (selector: string, timeout = 5000) => {
  cy.get(selector, { timeout }).should('not.exist');
};

export const verifyToastMessage = (message: string | RegExp, timeout = 5000) => {
  cy.contains(message, { timeout }).should('be.visible');
};

export const fillComponenteForm = (dados: {
  nome: string;
  categoria?: string;
  estoqueMinimo?: number;
  descricao?: string;
}) => {
  cy.get('input[name="nome"]').clear().type(dados.nome);
  
  if (dados.categoria) {
    cy.get('select[name="categoria"]').select(dados.categoria);
  }
  
  if (dados.estoqueMinimo !== undefined) {
    cy.get('input[name="estoque_minimo"]').clear().type(dados.estoqueMinimo.toString());
  }
  
  if (dados.descricao) {
    cy.get('textarea[name="descricao"]').clear().type(dados.descricao);
  }
};

export const openComponenteMenu = (index: number) => {
  cy.getByData(`componente-card-${index}`).within(() => {
    cy.get('button').first().click();
  });
};

export const openEntradaModal = (componenteIndex: number) => {
  openComponenteMenu(componenteIndex);
  cy.contains('Entrada').click();
};

export const openSaidaModal = (componenteIndex: number) => {
  openComponenteMenu(componenteIndex);
  cy.contains('Saída').click();
};

export const registrarEntrada = (localizacaoId: string, quantidade: number) => {
  cy.get('[role="dialog"]').within(() => {
    cy.get('select[name="localizacao"]').select(localizacaoId);
    cy.get('input[name="quantidade"]').clear().type(quantidade.toString());
    cy.contains('button', /confirmar|salvar|adicionar/i).click();
  });
};

export const registrarSaida = (localizacaoId: string, quantidade: number) => {
  cy.get('[role="dialog"]').within(() => {
    cy.get('select[name="localizacao"]').select(localizacaoId);
    cy.get('input[name="quantidade"]').clear().type(quantidade.toString());
    cy.contains('button', /confirmar|salvar|retirar/i).click();
  });
};

export const excluirComponente = (componenteIndex: number) => {
  openComponenteMenu(componenteIndex);
  cy.contains('Excluir').click();
  
  cy.get('[role="dialog"]').within(() => {
    cy.contains('button', /excluir|deletar|confirmar/i).click();
  });
};

export const aplicarFiltros = (filtros: {
  categoria?: string;
  status?: string;
}) => {
  cy.contains('button', 'Filtros').click();
  
  cy.get('[role="dialog"]').within(() => {
    if (filtros.categoria) {
      cy.contains('Categoria').parent().find('select').select(filtros.categoria);
    }
    
    if (filtros.status) {
      cy.contains('Status').parent().find('select').select(filtros.status);
    }
    
    cy.contains('button', 'Aplicar Filtros').click();
  });
};

export const limparPesquisa = () => {
  cy.get('input[placeholder*="Pesquisar componente"]').clear();
};

export const pesquisarComponente = (nome: string) => {
  cy.get('input[placeholder*="Pesquisar componente"]').clear().type(nome);
};

export const irParaProximaPagina = () => {
  cy.contains('button', 'Próxima').click();
};

export const irParaPaginaAnterior = () => {
  cy.contains('button', 'Anterior').click();
};

export const verificarCardComponente = (
  index: number,
  dados: {
    nome?: string;
    categoria?: string;
    quantidade?: number;
    status?: string;
  }
) => {
  cy.getByData(`componente-card-${index}`).within(() => {
    if (dados.nome) {
      cy.contains(dados.nome).should('be.visible');
    }
    if (dados.categoria) {
      cy.contains(dados.categoria).should('be.visible');
    }
    if (dados.quantidade !== undefined) {
      cy.contains(dados.quantidade.toString()).should('be.visible');
    }
    if (dados.status) {
      cy.contains(dados.status).should('be.visible');
    }
  });
};

export const waitForAPIRequests = (aliases: string[], timeout = 10000) => {
  aliases.forEach(alias => {
    cy.wait(alias, { timeout });
  });
};

export const limparComponenteTeste = (componenteId: string) => {
  const apiUrl = Cypress.env('API_URL');
  
  cy.request({
    method: 'PATCH',
    url: `${apiUrl}/componentes/${componenteId}/inativar`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    failOnStatusCode: false
  }).then(() => {
    cy.log(`Componente ${componenteId} removido`);
  });
};

export const verificarEstatisticas = () => {
  const stats = ['Total de Componentes', 'Em Estoque', 'Baixo Estoque', 'Indisponível'];
  
  stats.forEach(stat => {
    cy.contains(stat).should('be.visible');
  });
};

export const setupComponentesIntercepts = () => {
  const apiUrl = Cypress.env('API_URL');
  
  cy.intercept('GET', `${apiUrl}/componentes*`).as('getComponentes');
  cy.intercept('GET', `${apiUrl}/componentes/*`).as('getComponenteById');
  cy.intercept('POST', `${apiUrl}/componentes`).as('createComponente');
  cy.intercept('PUT', `${apiUrl}/componentes/*`).as('updateComponente');
  cy.intercept('PATCH', `${apiUrl}/componentes/*`).as('patchComponente');
  cy.intercept('PATCH', `${apiUrl}/componentes/*/inativar`).as('deleteComponente');
  cy.intercept('GET', `${apiUrl}/categorias*`).as('getCategorias');
  cy.intercept('GET', `${apiUrl}/localizacoes*`).as('getLocalizacoes');
  cy.intercept('POST', `${apiUrl}/movimentacoes`).as('createMovimentacao');
  cy.intercept('GET', `${apiUrl}/estoques/componente/*`).as('getEstoquesComponente');
};

export const loginAndNavigateToComponentes = () => {
  const frontendUrl = Cypress.env('FRONTEND_URL');
  const email = Cypress.env('TEST_USER_EMAIL');
  const senha = Cypress.env('TEST_USER_PASSWORD');
  
  cy.visit(frontendUrl);
  cy.login(email, senha);
  cy.visit(`${frontendUrl}/componentes`);
  cy.wait('@getComponentes', { timeout: 10000 });
};
