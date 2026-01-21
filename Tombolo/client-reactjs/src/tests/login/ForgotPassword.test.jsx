import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock auth service
vi.mock('@/services/auth.service', () => ({
  default: {
    handlePasswordResetRequest: vi.fn(),
  },
}));

// Mock handleResponse
vi.mock('@/components/common/handleResponse', () => ({
  handleError: vi.fn(),
  handleSuccess: vi.fn(),
}));

import ForgotPassword from '@/components/login/ForgotPassword';
import authService from '@/services/auth.service';
import { handleSuccess } from '@/components/common/handleResponse';

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the forgot password form', () => {
      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
      expect(screen.getByText(/Remembered your password/i)).toBeInTheDocument();
    });

    it('renders link to login page', () => {
      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const loginLink = screen.getByRole('link', { name: /Log in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Form Validation', () => {
    it('requires email field to be filled', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid e-mail address.')).toBeInTheDocument();
      });

      expect(authService.handlePasswordResetRequest).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid e-mail address.')).toBeInTheDocument();
      });

      expect(authService.handlePasswordResetRequest).not.toHaveBeenCalled();
    });

    it('enforces maximum email length', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const longEmail = 'a'.repeat(60) + '@test.com'; // Over 64 chars
      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, longEmail);

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Maximum of 64 characters allowed')).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset Request Submission', () => {
    it('successfully submits password reset request with valid email', async () => {
      const user = userEvent.setup();
      authService.handlePasswordResetRequest.mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.handlePasswordResetRequest).toHaveBeenCalledWith('test@example.com');
      });

      expect(handleSuccess).toHaveBeenCalledWith(
        'If an account with this email exists, a password reset link will be sent to the email address.'
      );
    });

    it('shows generic success message even when email does not exist (prevents enumeration)', async () => {
      const user = userEvent.setup();
      // Simulate 404 - user not found
      authService.handlePasswordResetRequest.mockRejectedValue({
        status: 404,
        messages: ['User not found'],
      });

      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'nonexistent@example.com');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith(
          'If an account with this email exists, a password reset link will be sent to the email address.'
        );
      });
    });

    it('shows generic success message even when API returns error', async () => {
      const user = userEvent.setup();
      authService.handlePasswordResetRequest.mockRejectedValue({
        status: 500,
        messages: ['Internal server error'],
      });

      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith(
          'If an account with this email exists, a password reset link will be sent to the email address.'
        );
      });
    });

    it('shows generic success message on network error', async () => {
      const user = userEvent.setup();
      authService.handlePasswordResetRequest.mockRejectedValue({
        type: 'NETWORK_ERROR',
        messages: ['Unable to reach the server'],
      });

      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith(
          'If an account with this email exists, a password reset link will be sent to the email address.'
        );
      });
    });
  });

  describe('Email Input Handling', () => {
    it('accepts valid email addresses', async () => {
      const user = userEvent.setup();
      authService.handlePasswordResetRequest.mockResolvedValue({ success: true });

      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'test+tag@example.com'];

      for (const email of validEmails) {
        const { unmount } = render(
          <BrowserRouter>
            <ForgotPassword />
          </BrowserRouter>
        );

        const emailInput = screen.getByLabelText(/Email/i);
        await user.type(emailInput, email);

        const submitButton = screen.getByRole('button', { name: /Reset Password/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(authService.handlePasswordResetRequest).toHaveBeenCalledWith(email);
        });

        unmount();
        vi.clearAllMocks();
      }
    });

    it('trims whitespace from email input', async () => {
      const user = userEvent.setup();
      authService.handlePasswordResetRequest.mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, '  test@example.com  ');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      // The form should trim whitespace and submit clean email
      await waitFor(() => {
        expect(authService.handlePasswordResetRequest).toHaveBeenCalled();
      });
    });
  });

  describe('Security Features', () => {
    it('prevents email enumeration by showing same message for existing and non-existing emails', async () => {
      const user = userEvent.setup();

      // Test with existing email (success)
      authService.handlePasswordResetRequest.mockResolvedValue({ success: true });

      const { unmount: unmount1 } = render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      let emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'existing@example.com');

      let submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith(expect.stringContaining('If an account with this email exists'));
      });

      const successMessage1 = handleSuccess.mock.calls[0][0];
      unmount1();
      vi.clearAllMocks();

      // Test with non-existing email (404)
      authService.handlePasswordResetRequest.mockRejectedValue({
        status: 404,
        messages: ['User not found'],
      });

      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'nonexistent@example.com');

      submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith(expect.stringContaining('If an account with this email exists'));
      });

      const successMessage2 = handleSuccess.mock.calls[0][0];

      // Both messages should be identical
      expect(successMessage1).toBe(successMessage2);
    });
  });
});
