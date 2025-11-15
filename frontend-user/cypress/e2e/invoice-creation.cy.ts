describe('Invoice Creation Flow', () => {
    beforeEach(() => {
        // Login before each test
        cy.visit('/login');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Wait for redirect to dashboard
        cy.url().should('include', '/dashboard');
    });

    it('should create a new invoice successfully', () => {
        // Navigate to invoice creation
        cy.contains('Create Invoice').click();
        cy.url().should('include', '/invoices/create');

        // Step 1: Company Details
        cy.get('input[name="issueDate"]').should('be.visible');
        cy.get('input[name="dueDate"]').type('2025-12-31');
        cy.get('select[name="paymentMethod"]').select('bank_transfer');
        cy.contains('Next').click();

        // Step 2: Customer Selection
        cy.get('input[name="customer"]').type('Test Customer');
        cy.contains('Test Customer').click();
        cy.contains('Next').click();

        // Step 3: Line Items
        cy.get('input[name="productSearch"]').type('Product A');
        cy.contains('Product A').click();
        cy.get('input[name="quantity"]').clear().type('2');
        cy.contains('Add Item').click();
        cy.contains('Next').click();

        // Step 4: Preview and Submit
        cy.contains('Preview').should('be.visible');
        cy.contains('Submit Invoice').click();

        // Verify success
        cy.contains('Invoice created successfully').should('be.visible');
        cy.url().should('include', '/invoices');
    });

    it('should validate required fields', () => {
        cy.contains('Create Invoice').click();

        // Try to proceed without filling required fields
        cy.contains('Next').click();

        // Should show validation errors
        cy.contains('required').should('be.visible');
    });

    it('should save invoice as draft', () => {
        cy.contains('Create Invoice').click();

        // Fill minimum required fields
        cy.get('input[name="dueDate"]').type('2025-12-31');
        cy.contains('Next').click();

        // Select customer
        cy.get('input[name="customer"]').type('Test Customer');
        cy.contains('Test Customer').click();
        cy.contains('Next').click();

        // Add item
        cy.get('input[name="productSearch"]').type('Product A');
        cy.contains('Product A').click();
        cy.contains('Add Item').click();
        cy.contains('Next').click();

        // Save as draft
        cy.contains('Save as Draft').click();

        // Verify draft created
        cy.contains('Draft saved').should('be.visible');
        cy.url().should('include', '/invoices');
        cy.contains('Draft').should('be.visible');
    });
});
