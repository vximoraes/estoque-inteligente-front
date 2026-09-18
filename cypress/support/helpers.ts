// Fábricas de dados via API (cy.api, já autenticado pela sessão de cy.login)
// e helpers de interação de UI para componentes Radix/shadcn — nada aqui
// depende de cy.session, mas toda fábrica assume que a spec já chamou
// cy.login() antes (a sessão cookie autentica as chamadas de cy.api também).

export function sufixoUnico(prefixo = 'zz-teste') {
  return `${prefixo}-${Cypress._.random(0, 1e9)}`;
}

export function criarCategoria(overrides: Record<string, unknown> = {}) {
  return cy
    .api('POST', '/categorias', {
      nome: sufixoUnico('zz-categoria'),
      tipo: 'consumo',
      ...overrides,
    })
    .then((res) => {
      expect(res.status).to.eq(201);
      return res.body.data;
    });
}

export function criarLocalizacao(overrides: Record<string, unknown> = {}) {
  return cy
    .api('POST', '/localizacoes', {
      nome: sufixoUnico('zz-localizacao'),
      ...overrides,
    })
    .then((res) => {
      expect(res.status).to.eq(201);
      return res.body.data;
    });
}

export function criarFornecedor(overrides: Record<string, unknown> = {}) {
  return cy
    .api('POST', '/fornecedores', {
      nome: sufixoUnico('zz-fornecedor'),
      ...overrides,
    })
    .then((res) => {
      expect(res.status).to.eq(201);
      return res.body.data;
    });
}

export function criarItem(overrides: Record<string, unknown> = {}) {
  const { categoria, ...resto } = overrides;
  const comCategoria = (categoriaId: string) =>
    cy
      .api('POST', '/itens', {
        nome: sufixoUnico('zz-item'),
        categoria: categoriaId,
        estoque_minimo: '10',
        ...resto,
      })
      .then((res) => {
        expect(res.status).to.eq(201);
        return res.body.data;
      });

  if (categoria) return comCategoria(categoria as string);
  return criarCategoria().then((cat) => comCategoria(cat._id));
}

// Cypress não é baseado em Promise: um command chain é uma sequência linear
// no queue do teste, não uma árvore. Manter duas chains "paralelas" em
// variáveis separadas (ex.: categoriaId$ e localizacaoId$) e uni-las depois
// com .then() aninhado corrompe a ordem de execução — o valor que chega no
// callback mais interno acaba sendo de outra etapa da fila, não da chain
// pretendida. Toda fábrica com múltiplas dependências busca/cria cada uma
// dentro do .then() anterior, em sequência estrita.
export function criarPatrimonio(overrides: Record<string, unknown> = {}) {
  const { categoria, localizacao, ...resto } = overrides;

  const categoriaId$ = categoria
    ? cy.wrap(categoria as string)
    : criarCategoria({ tipo: 'permanente' }).then((cat) => cat._id as string);

  return categoriaId$.then((categoriaId) => {
    const localizacaoId$ = localizacao
      ? cy.wrap(localizacao as string)
      : criarLocalizacao().then((loc) => loc._id as string);

    return localizacaoId$.then((localizacaoId) =>
      cy
        .api('POST', '/patrimonios', {
          numero_patrimonio: sufixoUnico('zz-patrimonio'),
          categoria: categoriaId,
          localizacao: localizacaoId,
          ...resto,
        })
        .then((res) => {
          expect(res.status).to.eq(201);
          return res.body.data;
        }),
    );
  });
}

export function criarMovimentacao(overrides: Record<string, unknown> = {}) {
  const { item, localizacao, ...resto } = overrides;

  const item$ = item
    ? cy.wrap(item as string)
    : criarItem().then((i) => i._id as string);

  return item$.then((itemId) => {
    const localizacao$ = localizacao
      ? cy.wrap(localizacao as string)
      : criarLocalizacao().then((l) => l._id as string);

    return localizacao$.then((localizacaoId) =>
      cy
        .api('POST', '/movimentacoes', {
          tipo: 'entrada',
          quantidade: '50',
          item: itemId,
          localizacao: localizacaoId,
          ...resto,
        })
        .then((res) => {
          expect(res.status).to.eq(201);
          return res.body.data;
        }),
    );
  });
}

export function criarEmprestimo(overrides: Record<string, unknown> = {}) {
  const { item, localizacao, ...resto } = overrides;

  const criarComDependencias = (itemId: string, localizacaoId: string) =>
    cy
      .api('POST', '/emprestimos', {
        item: itemId,
        localizacao: localizacaoId,
        quantidade_emprestada: 5,
        solicitante_nome: sufixoUnico('zz-solicitante'),
        data_prevista_devolucao: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        ...resto,
      })
      .then((res) => {
        expect(res.status).to.eq(201);
        return res.body.data;
      });

  if (item && localizacao) {
    return criarComDependencias(item as string, localizacao as string);
  }
  // POST /movimentacoes retorna item/localizacao populados (objetos), não
  // ids — extrair _id antes de reenviar como payload de /emprestimos.
  return criarMovimentacao().then((mov) =>
    criarComDependencias(mov.item._id, mov.localizacao._id),
  );
}

export function criarNotificacao(overrides: Record<string, unknown> = {}) {
  return cy
    .api('POST', '/notificacoes', {
      mensagem: sufixoUnico('zz-notificacao'),
      ...overrides,
    })
    .then((res) => {
      expect(res.status).to.eq(201);
      return res.body.data;
    });
}

export function convidarUsuario(overrides: Record<string, unknown> = {}) {
  return cy
    .api('POST', '/usuarios/convidar', {
      nome: sufixoUnico('zz-usuario'),
      email: `${sufixoUnico('zz-usuario')}@teste.com`,
      ...overrides,
    })
    .then((res) => {
      expect(res.status).to.eq(201);
      return res.body.data.usuario;
    });
}

export function inativar(recurso: string, id: string) {
  return cy.api('PATCH', `/${recurso}/${id}/inativar`);
}

// Radix renderiza o Select em portal (fora do dialog/formulário no DOM) —
// procurar role="option" direto na página, nunca com .within() do dialog.
export function selecionarNoCombobox(dataTest: string, valor: string | RegExp) {
  cy.getByData(dataTest).click();
  cy.get('[role="option"]').contains(valor).click();
}

// O Dialog do Radix mantém pointer-events:none no body durante a animação de
// abertura — { force: true } evita falso-negativo de "elemento não clicável"
// nesse intervalo. Espera o dialog sumir em vez de cy.wait().
export function confirmarDialogo(dataTestBotao: string) {
  cy.getByData(dataTestBotao).should('not.be.disabled').click({ force: true });
  cy.get('[role="dialog"]').should('not.exist');
}
