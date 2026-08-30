declare global {
  namespace Cypress {
    interface Chainable {
      getByData(
        seletor: string,
        options?: Partial<Cypress.Timeoutable & Cypress.Loggable>,
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add(
  'getByData',
  (
    seletor: string,
    options?: Partial<Cypress.Timeoutable & Cypress.Loggable>,
  ) => {
    return cy.get(`[data-test="${seletor}"]`, options);
  },
);

export {};
