import { test, expect } from '@playwright/test';
import { InitialExperienceWizardPage } from '../poms/InitialExperienceWizardPage';

test('initial experience happy path', async ({ page }) => {
    const wizard = new InitialExperienceWizardPage(page);
    await wizard.goto();

    await wizard.expectOnInstanceSettings();
    await wizard.fillInstanceSettings({ name: 'Acme Instance', description: 'Acme test instance' });
    await wizard.next();

    await wizard.expectOnOwnerSettings();
    await wizard.fillOwnerRegistration({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: process.env.USER_EMAIL,
        password: process.env.USER_PASS,
        confirmPassword: process.env.USER_PASS,
    });
    await wizard.next();

    await wizard.submit();


    await expect(page.getByText('Verifying if the email is already in use ...')).toBeVisible();
    await expect(page.getByText('Creating user ...')).toBeVisible();
    await expect(page.getByText('Assigning owner role ...')).toBeVisible();
    await expect(page.getByText('Creating instance settings ...')).toBeVisible();
    await expect(page.getByText('Sending verification email ...')).toBeVisible();
    // await expect(page.getByText('Setup complete. Please check your email for the verification link.')).toBeVisible();
    await wizard.waitForCompletion();

    await wizard.goToLogin();
    await wizard.verify();
    await wizard.waitForVerify();

    await expect(page).toHaveURL(/\/?$/);
});
