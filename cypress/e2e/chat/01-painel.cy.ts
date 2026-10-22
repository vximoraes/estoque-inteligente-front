const API = () => Cypress.env('API_URL');

function respostaSSE(eventos: object[]) {
  return {
    statusCode: 200,
    headers: { 'content-type': 'text/event-stream' },
    body: eventos.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(''),
  };
}

function abrirNovaConversa() {
  cy.irPara('/bens/patrimonio', 'patrimonio-page');
  cy.getByData('chat-abrir').click();
  cy.getByData('chat-nova-conversa').click();
}

function enviar(texto: string) {
  cy.getByData('chat-campo-mensagem').type(texto);
  cy.getByData('chat-enviar').click();
}

describe('Chat - painel do agente', () => {
  beforeEach(() => {
    cy.login();
  });

  it('envia a pergunta e mostra a resposta em Markdown', () => {
    cy.intercept(
      'POST',
      `${API()}/ia/conversas/*/mensagens`,
      respostaSSE([
        { type: 'token', content: 'Você tem **12** ' },
        { type: 'token', content: 'notebooks.' },
        { type: 'done' },
      ]),
    ).as('mensagem');

    abrirNovaConversa();
    enviar('Quantos notebooks eu tenho?');

    cy.wait('@mensagem')
      .its('request.body')
      .should('deep.equal', { content: 'Quantos notebooks eu tenho?' });
    cy.getByData('chat-mensagem-usuario').should(
      'contain.text',
      'Quantos notebooks eu tenho?',
    );
    cy.getByData('chat-mensagem-assistente')
      .should('contain.text', 'Você tem 12 notebooks.')
      .find('strong')
      .should('have.text', '12');
    cy.getByData('chat-mensagem-assistente')
      .find('[data-test="chat-mensagem-data-hora"]')
      .should('exist');
  });

  it('não carrega imagem nem link externo vindos da resposta', () => {
    cy.intercept(
      'POST',
      `${API()}/ia/conversas/*/mensagens`,
      respostaSSE([
        {
          type: 'token',
          content:
            'Veja ![grafico](https://atacante.example/coleta.png) e [renove a senha](https://phishing.example/login) ou abra [Patrimônio](/bens/patrimonio).',
        },
        { type: 'done' },
      ]),
    ).as('mensagem');

    abrirNovaConversa();
    enviar('Mostre a descrição do item');
    cy.wait('@mensagem');

    cy.getByData('chat-mensagem-assistente').within(() => {
      cy.contains('renove a senha').should('be.visible');
      cy.get('img').should('not.exist');
      cy.get('a[href*="phishing.example"]').should('not.exist');
      cy.get('a[href="/bens/patrimonio"]').should('exist');
    });
  });

  it('mostra o erro quando o assistente falha', () => {
    cy.intercept(
      'POST',
      `${API()}/ia/conversas/*/mensagens`,
      respostaSSE([
        {
          type: 'error',
          message: 'Não foi possível processar sua mensagem. Tente novamente.',
        },
      ]),
    ).as('mensagem');

    abrirNovaConversa();
    enviar('Quantos itens?');
    cy.wait('@mensagem');

    cy.getByData('chat-mensagem-erro').should(
      'contain.text',
      'Não foi possível processar sua mensagem',
    );
  });

  it('lista a conversa no histórico e a exclui', () => {
    const titulo = `Zz conversa ${Cypress._.random(1e6, 1e7)}`;
    cy.api('POST', '/ia/conversas', { mensagem_inicial: titulo }).then(
      (res) => {
        expect(res.status).to.eq(201);
      },
    );

    cy.irPara('/bens/patrimonio', 'patrimonio-page');
    cy.getByData('chat-abrir').click();
    cy.getByData('chat-historico').click();
    cy.contains('[data-test="chat-conversa-item"]', titulo)
      .find('[data-test="chat-excluir-conversa"]')
      .click({ force: true });
    cy.getByData('chat-confirmar-exclusao').click();
    cy.contains('[data-test="chat-conversa-item"]', titulo).should('not.exist');
  });
});
