// Playwright Page Object Model for the Initial Experience Wizard
// Covers: instance settings step, owner registration step, review & submit, and completion flow.

import { Page, Locator } from '@playwright/test';

export interface InstanceSettings {
    name?: string | number;
    description?: string | number;
}

export interface OwnerRegistration {
    firstName?: string | number;
    lastName?: string | number;
    email?: string | number;
    password?: string | number;
    confirmPassword?: string | number;
    organization?: string | number;
}

export interface ReviewData {
    instanceName?: string | number;
    instanceDescription?: string | number;
    ownerFirstName?: string | number;
    ownerLastName?: string | number;
    ownerEmail?: string | number;
}

export class InitialExperienceWizardPage {
    private readonly page: Page;
    private readonly title: RegExp;

    constructor(page: Page) {
        this.page = page;
        this.title = /Welcome to tombolo/i;
    }

    async goto(): Promise<void> {
        // Route may vary depending on app mounting; try root and fallback to /wizard
        await this.page.goto(`/`);
        // Expect the wizard heading text present in Wizard.jsx
        await this.page.getByText(this.title).first().waitFor();
    }

    async verify(): Promise<void> {
        await this.page.goto(`/register?regId=test-verification-code`)
    }

    async waitForVerify(): Promise<void> {
        await this.page.getByText(/Log In With /i).waitFor();
    }

    // Step helpers
    async expectOnInstanceSettings(): Promise<void> {
        await this.page
            .getByRole('heading', { name: /instance settings|instance information/i })
            .or(this.page.getByText(/instance settings/i))
            .first()
            .waitFor();
        // The form uses labels "Instance Name" and "Instance Description"
        await this.page.getByLabel(/^instance name$/i).waitFor();
    }

    async expectOnOwnerSettings(): Promise<void> {
        // RegisterUserForm fields: First Name, Last Name, Email, Password, Confirm Password (typical)
        await this.page.getByLabel(/first name/i).waitFor();
    }

    async next(): Promise<void> {
        await this.page.getByRole('button', { name: /next/i }).click();
    }

    async previous(): Promise<void> {
        await this.page.getByRole('button', { name: /previous/i }).click();
    }

    async submit(): Promise<void> {
        await this.page.getByRole('button', { name: /submit/i }).click();
    }

    // Instance Settings step
    async fillInstanceSettings({ name, description }: InstanceSettings = {}): Promise<void> {
        if (name !== undefined) {
            await this.page.getByLabel(/^instance name$/i).fill(String(name));
        }
        if (description !== undefined) {
            await this.page.getByLabel(/^instance description$/i).fill(String(description));
        }
    }

    // Owner Registration step
    async fillOwnerRegistration({ firstName, lastName, email, password, confirmPassword, organization }: OwnerRegistration = {}): Promise<void> {
        if (firstName !== undefined) {
            await this.page.getByLabel(/first name/i).fill(String(firstName));
        }
        if (lastName !== undefined) {
            await this.page.getByLabel(/last name/i).fill(String(lastName));
        }
        if (email !== undefined) {
            await this.page.getByLabel(/email/i).fill(String(email));
        }
        if (password !== undefined) {
            // depending on RegisterUserForm, labels might be Password and Confirm Password
            await this.page.getByLabel(/^password$/i).fill(String(password));
        }
        if (confirmPassword !== undefined) {
            await this.page.getByLabel(/confirm password/i).fill(String(confirmPassword));
        }
        // Optional organization/company field if present
        if (organization !== undefined) {
            const org: Locator = this.page.getByLabel(/organization|company|org/i);
            if (await org.count()) {
                await org.fill(String(organization));
            }
        }
    }

    // Review step assertions (optional)
    async expectReviewWith({ instanceName, instanceDescription, ownerFirstName, ownerLastName, ownerEmail }: ReviewData = {}): Promise<void> {
        if (instanceName !== undefined) {
            await this.page.getByText(new RegExp(`Instance Name:.*${this.escapeRegex(instanceName)}`, 'i')).waitFor();
        }
        if (instanceDescription !== undefined) {
            await this.page
                .getByText(new RegExp(`Instance Description:.*${this.escapeRegex(instanceDescription)}`, 'i'))
                .waitFor();
        }
        if (ownerFirstName !== undefined) {
            await this.page.getByText(new RegExp(`First Name:.*${this.escapeRegex(ownerFirstName)}`, 'i')).waitFor();
        }
        if (ownerLastName !== undefined) {
            await this.page.getByText(new RegExp(`Last Name:.*${this.escapeRegex(ownerLastName)}`, 'i')).waitFor();
        }
        if (ownerEmail !== undefined) {
            await this.page.getByText(new RegExp(`Email:.*${this.escapeRegex(ownerEmail)}`, 'i')).waitFor();
        }
    }

    // Completion wait: watch stream messages or final button
    async waitForCompletion(): Promise<void> {
        // The wizard shows a "Go to Login Page" button when completedSuccessfully
        await this.page.getByRole('button', { name: /go to login page/i }).waitFor({ timeout: 60000 });
    }

    async goToLogin(): Promise<void> {
        await this.page.getByRole('button', { name: /go to login page/i }).click();
    }

    private escapeRegex(str: string | number): string {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

export default InitialExperienceWizardPage;
