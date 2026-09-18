// Import commands.js using ES2015 syntax:
import './commands';

// Aquece a API antes da primeira spec — o middleware.ts chama
// ${API_URL}/api/auth/get-session em toda navegação, e a primeira requisição
// contra a API de teste recém-subida pode ser lenta o bastante para estourar
// o responseTimeout.
before(() => {
  cy.request({
    url: Cypress.env('API_URL'),
    failOnStatusCode: false,
    timeout: 30000,
  });
});
