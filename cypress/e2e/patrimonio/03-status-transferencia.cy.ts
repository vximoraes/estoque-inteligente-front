import { criarLocalizacao, criarPatrimonio } from '../../support/helpers';

describe('Patrimônio - transição de status e transferência', () => {
  beforeEach(() => {
    cy.login();
  });

  it('envia uma unidade disponível para manutenção', () => {
    criarPatrimonio().then((patrimonio) => {
      cy.irPara('/bens/patrimonio', 'patrimonio-page');
      cy.getByData('search-input').type(patrimonio.numero_patrimonio);
      cy.getByData('patrimonio-card-acoes-trigger').first().click();
      cy.getByData('patrimonio-acao-manutencao').click();

      cy.getByData('modal-patrimonio-status').should('be.visible');
      cy.getByData('modal-patrimonio-status-confirmar').click();
      cy.getByData('modal-patrimonio-status').should('not.exist');

      // A busca já filtra pra essa unidade desde o passo anterior — não
      // mexer de novo no campo controlado (clear()+type() corre contra o
      // debounce da busca e pode não limpar de fato).
      cy.getByData('patrimonio-card-status').should(
        'contain.text',
        'Manutenção',
      );
    });
  });

  it('transfere uma unidade para outra localização', () => {
    criarPatrimonio().then((patrimonio) => {
      criarLocalizacao().then((novaLocalizacao) => {
        cy.irPara('/bens/patrimonio', 'patrimonio-page');
        cy.getByData('search-input').type(patrimonio.numero_patrimonio);
        cy.getByData('patrimonio-card-acoes-trigger').first().click();
        cy.getByData('patrimonio-acao-transferir').click();

        cy.getByData('modal-patrimonio-transferir').should('be.visible');
        cy.getByData('botao-selecionar-localizacao').click();
        cy.getByData('input-pesquisa-localizacao').type(novaLocalizacao.nome);
        cy.get('[data-test="localizacao-option"]')
          .contains(novaLocalizacao.nome)
          .click();
        cy.getByData('modal-patrimonio-transferir-confirmar').click();
        cy.getByData('modal-patrimonio-transferir').should('not.exist');

        // A busca já filtra pra essa unidade desde o passo anterior — não
        // mexer de novo no campo controlado.
        cy.getByData('patrimonio-card-localizacao').should(
          'contain.text',
          novaLocalizacao.nome,
        );
      });
    });
  });
});
