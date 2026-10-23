import { convidarUsuario } from '../../support/helpers';

const API = () => Cypress.env('API_URL');
const EMAIL = () => Cypress.env('TEST_USER_COMUM_EMAIL');
const SENHA = () => Cypress.env('TEST_USER_COMUM_PASSWORD');
const NOVA_SENHA = 'Nova@Senha123';

function trocarSenhaPelaApi(atual: string, nova: string) {
  return cy
    .request({
      method: 'POST',
      url: `${API()}/api/auth/sign-in/email`,
      body: { email: EMAIL(), password: atual },
      failOnStatusCode: false,
    })
    .then((login) => {
      if (login.status !== 200) return;
      cy.request({
        method: 'POST',
        url: `${API()}/api/auth/change-password`,
        headers: { Authorization: `Bearer ${login.body.token}` },
        body: { currentPassword: atual, newPassword: nova },
        failOnStatusCode: false,
      });
    });
}

describe('Perfil - troca de senha', () => {
  after(() => {
    trocarSenhaPelaApi(NOVA_SENHA, SENHA());
  });

  it('troca a senha pela tela e entra com a nova', () => {
    cy.clearCookies();
    cy.loginViaAPI(EMAIL(), SENHA());
    cy.irPara('/perfil', 'perfil-page');
    cy.getByData('edit-senha-button').click();
    cy.getByData('input-senha-atual').type(SENHA());
    cy.getByData('input-senha-nova').type(NOVA_SENHA);
    cy.getByData('input-senha-confirmar').type(NOVA_SENHA);
    cy.getByData('save-senha-button').click();
    cy.esperarToast('Senha alterada com sucesso!');

    cy.request({
      method: 'POST',
      url: `${API()}/api/auth/sign-in/email`,
      body: { email: EMAIL(), password: NOVA_SENHA },
    })
      .its('status')
      .should('eq', 200);
  });
});

describe('Usuários - reenvio de convite', () => {
  beforeEach(() => {
    cy.login();
  });

  it('avisa quando o e-mail não está configurado e o convite não sai', () => {
    convidarUsuario().then((usuario) => {
      cy.irPara('/usuarios', 'usuarios-page');
      cy.getByData('search-input').type(usuario.nome);
      cy.contains('tr', usuario.nome)
        .find('[data-test="reenviar-convite-button"]')
        .click();
      cy.esperarToast(
        'O serviço de e-mail não está configurado; o convite não foi reenviado.',
      );
    });
  });
});
