/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom login command
Cypress.Commands.add('login', (email?: string, password?: string) => {
    const defaultEmail = email || 'test@example.com';
    const defaultPassword = password || 'password123';

    cy.visit('/login');
    cy.get('input[name="email"]').type(defaultEmail);
    cy.get('input[name="password"]').type(defaultPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
});

// Custom logout command
Cypress.Commands.add('logout', () => {
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Logout').click();
    cy.url().should('include', '/login');
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            login(email?: string, password?: string): Chainable<void>;
            logout(): Chainable<void>;
        }
    }
}

export { };
