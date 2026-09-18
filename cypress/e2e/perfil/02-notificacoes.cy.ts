import { criarNotificacao } from '../../support/helpers';

describe('Perfil - notificações', () => {
  beforeEach(() => {
    cy.login();
  });

  it('lista notificações do usuário autenticado', () => {
    criarNotificacao().then((notificacao) => {
      cy.irPara('/perfil', 'perfil-page');
      cy.getByData('notificacoes-list').should('be.visible');
      cy.getByData(`notificacao-item-${notificacao._id}`).should(
        'contain.text',
        notificacao.mensagem,
      );
    });
  });

  it('marca todas as notificações como lidas', () => {
    criarNotificacao().then(() => {
      cy.irPara('/perfil', 'perfil-page');
      cy.getByData('marcar-todas-lidas-button').click();
      cy.getByData('notificacoes-nao-lidas-count').should('not.exist');
    });
  });

  it('exclui uma notificação', () => {
    criarNotificacao().then((notificacao) => {
      cy.irPara('/perfil', 'perfil-page');
      cy.getByData(`notificacao-item-${notificacao._id}`).should('be.visible');
      cy.getByData(`notificacao-item-${notificacao._id}`).within(() => {
        cy.getByData('notificacao-excluir-button').click();
      });
      cy.getByData(`notificacao-item-${notificacao._id}`).should('not.exist');
    });
  });
});
