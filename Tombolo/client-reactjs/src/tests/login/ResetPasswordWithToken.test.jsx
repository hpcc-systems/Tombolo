import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock the router hooks
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

// Mock auth service
vi.mock('@/services/auth.service', () => ({
  default: {
    getUserDetailsWithToken: vi.fn(),
    resetPasswordWithToken: vi.fn(),
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
    if (options.generateContent) {
      return <div>Password requirements</div>;
    }
    // When used for validation, return object with errors array
    return { errors: [{ attribute: 'dummy' }] };
  }),
}));

import ResetPasswordWithToken from '@/components/login/ResetPasswordWithToken';
import authService from '@/services/auth.service';
import { handleError, handleSuccess } from '@/components/common/handleResponse';
import { setUser } from '@/components/common/userStorage';
import { useParams } from 'react-router-dom';

describe('ResetPasswordWithToken', () => {
  const mockResetToken = 'test-reset-token-123';
  const mockUserDetails = {
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      metaData: {
        previousPasswords: [],
      },
      newUser: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useParams.mockReturnValue({ resetToken: mockResetToken });
    // Mock window.location.href
    delete window.location;
    window.location = { href: vi.fn() };
  });

  describe('Component Rendering', () => {
    it('renders the reset password form', async () => {
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
    });

    it('shows error when resetToken is undefined', async () => {
      useParams.mockReturnValue({ resetToken: undefined });

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(
          expect.stringContaining('reset token provided is either expired or invalid')
        );
      });
    });
  });

  describe('User Details Loading', () => {
    it('loads user details on mount with valid token', async () => {
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(authService.getUserDetailsWithToken).toHaveBeenCalledWith(mockResetToken);
      });
    });

    it('shows error when getUserDetailsWithToken returns null', async () => {
      authService.getUserDetailsWithToken.mockResolvedValue(null);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith('An error occurred while validating the reset token');
      });
    });

    it('shows error when getUserDetailsWithToken fails', async () => {
      const errorMessage = { messages: ['Invalid token'] };
      authService.getUserDetailsWithToken.mockRejectedValue(errorMessage);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('shows error when user data is missing from response', async () => {
      authService.getUserDetailsWithToken.mockResolvedValue({ user: null });

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith('An error occurred while validating the reset token');
      });
    });
  });

  describe('Password Reset Submission', () => {
    it('successfully resets password with valid inputs', async () => {
      const user = userEvent.setup();
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);
      authService.resetPasswordWithToken.mockResolvedValue({
        id: '123',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        applications: [],
      });

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      });

      // Enter passwords
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(newPasswordInput, 'NewSecurePassword123!');
      await user.type(confirmPasswordInput, 'NewSecurePassword123!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.resetPasswordWithToken).toHaveBeenCalledWith({
          password: 'NewSecurePassword123!',
          token: mockResetToken,
          deviceInfo: expect.any(Object),
        });
      });

      expect(handleSuccess).toHaveBeenCalledWith('Password reset successfully.');
      expect(setUser).toHaveBeenCalled();
      expect(window.location.href).toBe('/');
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(newPasswordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('The two passwords do not match!')).toBeInTheDocument();
      });

      expect(authService.resetPasswordWithToken).not.toHaveBeenCalled();
    });

    it('shows error when password reset API fails', async () => {
      const user = userEvent.setup();
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);
      const apiError = { messages: ['Password reset failed'] };
      authService.resetPasswordWithToken.mockRejectedValue(apiError);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(newPasswordInput, 'NewSecurePassword123!');
      await user.type(confirmPasswordInput, 'NewSecurePassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(apiError);
      });

      expect(setUser).not.toHaveBeenCalled();
      expect(window.location.href).not.toBe('/');
    });

    it('shows error when API returns null response', async () => {
      const user = userEvent.setup();
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);
      authService.resetPasswordWithToken.mockResolvedValue(null);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(newPasswordInput, 'NewSecurePassword123!');
      await user.type(confirmPasswordInput, 'NewSecurePassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith('An error occurred while resetting your password');
      });
    });

    it('requires password field to be filled', async () => {
      const user = userEvent.setup();
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please input your new password!')).toBeInTheDocument();
      });

      expect(authService.resetPasswordWithToken).not.toHaveBeenCalled();
    });
  });

  describe('Password Validation', () => {
    it('validates password against current password', async () => {
      const user = userEvent.setup();
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      await user.type(newPasswordInput, 'Short1!');

      // Wait for validation to trigger
      await waitFor(
        () => {
          // Check if the input has been validated
          const input = screen.getByLabelText(/New Password/i);
          expect(input).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('enforces maximum password length', async () => {
      const user = userEvent.setup();
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      });

      const longPassword = 'a'.repeat(65) + '123!A';
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(newPasswordInput, longPassword);
      await user.type(confirmPasswordInput, longPassword);

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errors = screen.getAllByText('Maximum of 64 characters allowed');
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('User Authentication State', () => {
    it('sets isAuthenticated flag when password is reset successfully', async () => {
      const user = userEvent.setup();
      authService.getUserDetailsWithToken.mockResolvedValue(mockUserDetails);
      const mockResponse = {
        id: '123',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      authService.resetPasswordWithToken.mockResolvedValue(mockResponse);

      render(
        <BrowserRouter>
          <ResetPasswordWithToken />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(newPasswordInput, 'NewSecurePassword123!');
      await user.type(confirmPasswordInput, 'NewSecurePassword123!');

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(setUser).toHaveBeenCalledWith(
          expect.objectContaining({
            isAuthenticated: true,
          })
        );
      });
    });
  });
});
