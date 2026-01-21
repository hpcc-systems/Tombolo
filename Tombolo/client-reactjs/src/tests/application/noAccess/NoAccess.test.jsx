import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth service
vi.mock('@/services/auth.service', () => ({
  default: {
    requestAccess: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock handleResponse
vi.mock('@/components/common/handleResponse', () => ({
  handleError: vi.fn(),
  handleSuccess: vi.fn(),
}));

// Mock userStorage
vi.mock('@/components/common/userStorage', () => ({
  getUser: vi.fn(),
  setUser: vi.fn(),
}));

// Mock RequestAccessModal
vi.mock('@/components/application/noAccess/requestAccessModal', () => ({
  default: ({ isOpen, onSubmit, setIsOpen }) =>
    isOpen ? (
      <div data-testid="request-access-modal">
        <h2>Request Access Modal</h2>
        <button onClick={onSubmit}>Submit Request</button>
        <button onClick={() => setIsOpen(false)}>Cancel</button>
      </div>
    ) : null,
}));

import NoAccess from '@/components/application/noAccess';
import authService from '@/services/auth.service';
import { apiClient } from '@/services/api';
import { handleError, handleSuccess } from '@/components/common/handleResponse';
import { getUser, setUser } from '@/components/common/userStorage';

describe('NoAccess', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    roles: [],
    applications: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockReturnValue(mockUser);
    delete window.location;
    window.location = { replace: vi.fn() };
  });

  describe('Component Rendering', () => {
    it('renders the no access page with correct content', () => {
      render(<NoAccess />);

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.getByText(/You do not currently have any assigned Roles or Applications/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Request Access/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Check Access Status/i })).toBeInTheDocument();
    });

    it('does not show modal on initial render', () => {
      render(<NoAccess />);

      expect(screen.queryByTestId('request-access-modal')).not.toBeInTheDocument();
    });
  });

  describe('Request Access Modal', () => {
    it('opens modal when Request Access button is clicked', async () => {
      const user = userEvent.setup();
      render(<NoAccess />);

      const requestButton = screen.getByRole('button', { name: /Request Access/i });
      await user.click(requestButton);

      await waitFor(() => {
        expect(screen.getByTestId('request-access-modal')).toBeInTheDocument();
      });
    });

    it('closes modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<NoAccess />);

      const requestButton = screen.getByRole('button', { name: /Request Access/i });
      await user.click(requestButton);

      await waitFor(() => {
        expect(screen.getByTestId('request-access-modal')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('request-access-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Access Request Submission', () => {
    it('submits access request successfully', async () => {
      const user = userEvent.setup();
      authService.requestAccess.mockResolvedValue({ success: true });

      render(<NoAccess />);

      const requestButton = screen.getByRole('button', { name: /Request Access/i });
      await user.click(requestButton);

      await waitFor(() => {
        expect(screen.getByTestId('request-access-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.requestAccess).toHaveBeenCalledWith({
          id: mockUser.id,
          roles: mockUser.roles,
          applications: mockUser.applications,
          comment: 'No comment provided',
        });
        expect(handleSuccess).toHaveBeenCalledWith(
          'A request has been sent to your administration team to grant you access'
        );
        expect(screen.queryByTestId('request-access-modal')).not.toBeInTheDocument();
      });
    });

    it('handles error when user is not found', async () => {
      const user = userEvent.setup();
      getUser.mockReturnValue(null);

      render(<NoAccess />);

      const requestButton = screen.getByRole('button', { name: /Request Access/i });
      await user.click(requestButton);

      await waitFor(() => {
        expect(screen.getByTestId('request-access-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith('User not found');
        expect(authService.requestAccess).not.toHaveBeenCalled();
      });
    });

    it('handles request access API error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to submit request';
      authService.requestAccess.mockRejectedValue({ message: errorMessage });

      render(<NoAccess />);

      const requestButton = screen.getByRole('button', { name: /Request Access/i });
      await user.click(requestButton);

      await waitFor(() => {
        expect(screen.getByTestId('request-access-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('handles multiple error messages from API', async () => {
      const user = userEvent.setup();
      const errorMessages = ['Error 1', 'Error 2'];
      authService.requestAccess.mockRejectedValue({ messages: errorMessages });

      render(<NoAccess />);

      const requestButton = screen.getByRole('button', { name: /Request Access/i });
      await user.click(requestButton);

      await waitFor(() => {
        expect(screen.getByTestId('request-access-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(errorMessages);
      });
    });

    it('uses default comment when none provided', async () => {
      const user = userEvent.setup();
      authService.requestAccess.mockResolvedValue({ success: true });

      render(<NoAccess />);

      const requestButton = screen.getByRole('button', { name: /Request Access/i });
      await user.click(requestButton);

      await waitFor(() => {
        expect(screen.getByTestId('request-access-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.requestAccess).toHaveBeenCalledWith(
          expect.objectContaining({
            comment: 'No comment provided',
          })
        );
      });
    });
  });

  describe('Check Access Status', () => {
    it('successfully checks and grants access when user has roles and applications', async () => {
      const user = userEvent.setup();
      const updatedUser = {
        ...mockUser,
        roles: ['admin'],
        applications: ['app1'],
      };

      apiClient.get.mockResolvedValue({ data: updatedUser });
      authService.refreshToken.mockResolvedValue({ success: true });

      render(<NoAccess />);

      const checkButton = screen.getByRole('button', { name: /Check Access Status/i });
      await user.click(checkButton);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
        expect(authService.refreshToken).toHaveBeenCalled();
        expect(setUser).toHaveBeenCalledWith(
          JSON.stringify({
            ...mockUser,
            ...updatedUser,
            isAuthenticated: true,
          })
        );
        expect(handleSuccess).toHaveBeenCalledWith('Access granted! Redirecting...');
      });

      await waitFor(
        () => {
          expect(window.location.replace).toHaveBeenCalledWith('/');
        },
        { timeout: 2000 }
      );
    });

    it('shows message when access not yet granted', async () => {
      const user = userEvent.setup();
      const updatedUser = {
        ...mockUser,
        roles: [],
        applications: [],
      };

      apiClient.get.mockResolvedValue({ data: updatedUser });

      render(<NoAccess />);

      const checkButton = screen.getByRole('button', { name: /Check Access Status/i });
      await user.click(checkButton);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
        expect(handleSuccess).toHaveBeenCalledWith('Access not yet granted. Please try again later.');
        expect(authService.refreshToken).not.toHaveBeenCalled();
        expect(window.location.replace).not.toHaveBeenCalled();
      });
    });

    it('shows message when user has roles but no applications', async () => {
      const user = userEvent.setup();
      const updatedUser = {
        ...mockUser,
        roles: ['admin'],
        applications: [],
      };

      apiClient.get.mockResolvedValue({ data: updatedUser });

      render(<NoAccess />);

      const checkButton = screen.getByRole('button', { name: /Check Access Status/i });
      await user.click(checkButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('Access not yet granted. Please try again later.');
        expect(authService.refreshToken).not.toHaveBeenCalled();
      });
    });

    it('shows message when user has applications but no roles', async () => {
      const user = userEvent.setup();
      const updatedUser = {
        ...mockUser,
        roles: [],
        applications: ['app1'],
      };

      apiClient.get.mockResolvedValue({ data: updatedUser });

      render(<NoAccess />);

      const checkButton = screen.getByRole('button', { name: /Check Access Status/i });
      await user.click(checkButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('Access not yet granted. Please try again later.');
        expect(authService.refreshToken).not.toHaveBeenCalled();
      });
    });

    it('handles error when user is not found during check', async () => {
      const user = userEvent.setup();
      getUser.mockReturnValue(null);

      render(<NoAccess />);

      const checkButton = screen.getByRole('button', { name: /Check Access Status/i });
      await user.click(checkButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith('User not found');
        expect(apiClient.get).not.toHaveBeenCalled();
      });
    });

    it('handles API error when checking access status', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network error';
      apiClient.get.mockRejectedValue({ message: errorMessage });

      render(<NoAccess />);

      const checkButton = screen.getByRole('button', { name: /Check Access Status/i });
      await user.click(checkButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('handles multiple error messages from check access API', async () => {
      const user = userEvent.setup();
      const errorMessages = ['Error 1', 'Error 2'];
      apiClient.get.mockRejectedValue({ messages: errorMessages });

      render(<NoAccess />);

      const checkButton = screen.getByRole('button', { name: /Check Access Status/i });
      await user.click(checkButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(errorMessages);
      });
    });

    it('uses fallback error message when no error details provided', async () => {
      const user = userEvent.setup();
      apiClient.get.mockRejectedValue({});

      render(<NoAccess />);

      const checkButton = screen.getByRole('button', { name: /Check Access Status/i });
      await user.click(checkButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith('Failed to check access status');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state on check access button while checking', async () => {
      const user = userEvent.setup();

      // Create a promise that we control
      let resolveGetUser;
      const getUserPromise = new Promise(resolve => {
        resolveGetUser = resolve;
      });
      apiClient.get.mockReturnValue(getUserPromise);

      render(<NoAccess />);

      const checkButton = screen.getByRole('button', { name: /Check Access Status/i });

      // Start the check
      await user.click(checkButton);

      // Button should be in loading state
      await waitFor(() => {
        expect(checkButton).toHaveAttribute('class', expect.stringContaining('ant-btn-loading'));
      });

      // Resolve the promise
      resolveGetUser({ data: { ...mockUser, roles: [], applications: [] } });

      // Wait for loading to finish
      await waitFor(() => {
        expect(checkButton).not.toHaveAttribute('class', expect.stringContaining('ant-btn-loading'));
      });
    });
  });
});
