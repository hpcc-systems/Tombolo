import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock auth service
vi.mock('@/services/auth.service', () => ({
  default: {
    resetTempPassword: vi.fn(),
  },
}));

// Mock handleResponse
vi.mock('@/components/common/handleResponse', () => ({
  handleError: vi.fn(),
  handleSuccess: vi.fn(),
}));

// Mock userStorage
vi.mock('@/components/common/userStorage', () => ({
  setUser: vi.fn(),
}));

// Mock getDeviceInfo
vi.mock('@/components/login/utils', () => ({
  getDeviceInfo: vi.fn(() => ({
    userAgent: 'test-agent',
    platform: 'test-platform',
  })),
}));

// Mock password complexity validator
vi.mock('@/components/common/passwordComplexityValidator', () => ({
  default: vi.fn(options => {
    // When generateContent is true, return JSX for the popover
    if (options?.generateContent) {
      return <div>Password requirements</div>;
    }
    // When used for validation, return object with errors array
    return { errors: [{ attribute: 'dummy' }] };
  }),
}));

import ResetTempPassword from '@/components/login/ResetTempPassword';
import authService from '@/services/auth.service';
import { handleError } from '@/components/common/handleResponse';
import { setUser } from '@/components/common/userStorage';

describe('ResetTempPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    delete window.location;
    window.location = { href: 'http://localhost/reset-password/mock-token-123' };
  });

  describe('Component Rendering', () => {
    it('renders the temp password reset form', () => {
      render(
        <BrowserRouter>
          <ResetTempPassword />
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/Temporary Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires all fields to be filled', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <ResetTempPassword />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please input your temporary password!')).toBeInTheDocument();
      });

      expect(authService.resetTempPassword).not.toHaveBeenCalled();
    });

    it('validates that passwords match', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <ResetTempPassword />
        </BrowserRouter>
      );

      const tempPasswordInput = screen.getByLabelText(/Temporary Password/i);
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(tempPasswordInput, 'TempPass123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('The two passwords do not match!')).toBeInTheDocument();
      });

      expect(authService.resetTempPassword).not.toHaveBeenCalled();
    });

    it('enforces maximum password length', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <ResetTempPassword />
        </BrowserRouter>
      );

      const longPassword = 'a'.repeat(65) + '123!A';
      const tempPasswordInput = screen.getByLabelText(/Temporary Password/i);
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(tempPasswordInput, 'TempPass123!');
      await user.type(newPasswordInput, longPassword);
      await user.type(confirmPasswordInput, longPassword);

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Maximum of 64 characters allowed')).toBeInTheDocument();
      });
    });
  });

  describe('Temporary Password Reset Submission', () => {
    it('successfully resets temporary password', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          roles: [],
          applications: [],
        },
      };
      authService.resetTempPassword.mockResolvedValue(mockResponse);

      render(
        <BrowserRouter>
          <ResetTempPassword />
        </BrowserRouter>
      );

      const tempPasswordInput = screen.getByLabelText(/Temporary Password/i);
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(tempPasswordInput, 'TempPass123!');
      await user.type(newPasswordInput, 'NewSecurePassword123!');
      await user.type(confirmPasswordInput, 'NewSecurePassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.resetTempPassword).toHaveBeenCalledWith({
          tempPassword: 'TempPass123!',
          password: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!',
          token: 'mock-token-123',
          deviceInfo: expect.any(Object),
        });
      });

      expect(setUser).toHaveBeenCalled();
      expect(window.location.href).toBe('/');
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      authService.resetTempPassword.mockReturnValue(promise);

      render(
        <BrowserRouter>
          <ResetTempPassword />
        </BrowserRouter>
      );

      const tempPasswordInput = screen.getByLabelText(/Temporary Password/i);
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(tempPasswordInput, 'TempPass123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      // Check that button is disabled during loading
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise to complete the test
      resolvePromise({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          token: 'mock-jwt-token',
        },
      });

      // Wait for the success flow
      await waitFor(() => {
        expect(setUser).toHaveBeenCalled();
        expect(window.location.href).toBe('/');
      });
    });

    it('handles API error gracefully', async () => {
      const user = userEvent.setup();
      const apiError = { messages: ['Invalid temporary password'] };
      authService.resetTempPassword.mockRejectedValue(apiError);

      render(
        <BrowserRouter>
          <ResetTempPassword />
        </BrowserRouter>
      );

      const tempPasswordInput = screen.getByLabelText(/Temporary Password/i);
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(tempPasswordInput, 'WrongTempPass123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith('The temporary password you entered is incorrect. Please try again.');
      });

      expect(setUser).not.toHaveBeenCalled();
      expect(window.location.href).not.toBe('/');
    });

    it('sets isAuthenticated flag on successful password reset', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };
      authService.resetTempPassword.mockResolvedValue(mockResponse);

      render(
        <BrowserRouter>
          <ResetTempPassword />
        </BrowserRouter>
      );

      const tempPasswordInput = screen.getByLabelText(/Temporary Password/i);
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(tempPasswordInput, 'TempPass123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(setUser).toHaveBeenCalledWith(expect.stringContaining('"isAuthenticated":true'));
      });
    });
  });

  describe('Device Info', () => {
    it('includes device info in reset request', async () => {
      const user = userEvent.setup();
      authService.resetTempPassword.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      });

      render(
        <BrowserRouter>
          <ResetTempPassword />
        </BrowserRouter>
      );

      const tempPasswordInput = screen.getByLabelText(/Temporary Password/i);
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(tempPasswordInput, 'TempPass123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.resetTempPassword).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceInfo: {
              userAgent: 'test-agent',
              platform: 'test-platform',
            },
          })
        );
      });
    });
  });
});
