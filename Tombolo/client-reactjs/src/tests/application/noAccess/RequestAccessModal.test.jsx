import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Form } from 'antd';

import RequestAccessModal from '@/components/application/noAccess/requestAccessModal';

// Wrapper component to provide Form instance
const TestWrapper = ({ children, form }) => {
  const [testForm] = Form.useForm();
  const formToUse = form || testForm;

  return children({ form: formToUse });
};

describe('RequestAccessModal', () => {
  let defaultProps;
  let mockForm;

  beforeEach(() => {
    mockForm = {
      resetFields: vi.fn(),
      getFieldsValue: vi.fn(() => ({})),
      validateFields: vi.fn(() => Promise.resolve({})),
    };

    defaultProps = {
      form: mockForm,
      isOpen: true,
      setIsOpen: vi.fn(),
      onSubmit: vi.fn(),
    };
  });

  describe('Component Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      expect(screen.getByText('Request Access')).toBeInTheDocument();
      expect(screen.getByLabelText(/Additional Information/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
      // Check for form Close button (there's also a modal X button with aria-label="Close")
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.textContent === 'Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<RequestAccessModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Request Access')).not.toBeInTheDocument();
    });

    it('renders textarea with random placeholder', () => {
      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      const textarea = screen.getByLabelText(/Additional Information/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder');

      const placeholder = textarea.getAttribute('placeholder');
      const possiblePlaceholders = [
        'LET ME IN!!!!',
        'I NEED ACCESS, LIKE YESTERDAY!!!!',
        'PLEASE SOMEBODY HELP ME!!!!',
        'I NEED TO GET IN!!!!',
        'I NEED ACCESS NOW!!!!',
      ];

      expect(possiblePlaceholders).toContain(placeholder);
    });
  });

  describe('Form Interactions', () => {
    it('calls onSubmit when form is submitted', async () => {
      const user = userEvent.setup();

      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalled();
      });
    });

    it('allows user to type in comment field', async () => {
      const user = userEvent.setup();

      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      const textarea = screen.getByLabelText(/Additional Information/i);
      const testComment = 'Please grant me access to the system';

      await user.type(textarea, testComment);

      expect(textarea).toHaveValue(testComment);
    });

    it('enforces maximum character length of 256', async () => {
      const user = userEvent.setup();

      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      const textarea = screen.getByLabelText(/Additional Information/i);
      const longComment = 'a'.repeat(300);

      await user.type(textarea, longComment);

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Max Additional Information Length is 256 characters/i)).toBeInTheDocument();
      });
    });

    it('does not require comment field', async () => {
      const user = userEvent.setup();

      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      // Should not show required error since field is optional
      await waitFor(() => {
        expect(screen.queryByText('Please enter your comment')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Actions', () => {
    it('calls setIsOpen(false) when Close button is clicked', async () => {
      const user = userEvent.setup();

      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      // Get the form Close button (not the modal X button)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.textContent === 'Close');
      await user.click(closeButton);

      expect(defaultProps.setIsOpen).toHaveBeenCalledWith(false);
    });

    it('resets form fields when Close button is clicked', async () => {
      const user = userEvent.setup();
      const mockResetFields = vi.fn();

      render(
        <TestWrapper>
          {({ form }) => {
            // Override resetFields with our mock
            form.resetFields = mockResetFields;
            return <RequestAccessModal {...defaultProps} form={form} />;
          }}
        </TestWrapper>
      );

      // Get the form Close button (not the modal X button)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.textContent === 'Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockResetFields).toHaveBeenCalled();
      });
    });

    it('calls setIsOpen(false) when modal cancel (X) is clicked', async () => {
      const user = userEvent.setup();

      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      // Find the modal close button (X in the corner)
      const modalCloseButton = document.querySelector('.ant-modal-close');
      expect(modalCloseButton).toBeInTheDocument();

      await user.click(modalCloseButton);

      expect(defaultProps.setIsOpen).toHaveBeenCalledWith(false);
    });

    it('resets form fields when modal is cancelled', async () => {
      const user = userEvent.setup();
      const mockResetFields = vi.fn();

      render(
        <TestWrapper>
          {({ form }) => {
            // Override resetFields with our mock
            form.resetFields = mockResetFields;
            return <RequestAccessModal {...defaultProps} form={form} />;
          }}
        </TestWrapper>
      );

      const modalCloseButton = document.querySelector('.ant-modal-close');
      await user.click(modalCloseButton);

      await waitFor(() => {
        expect(mockResetFields).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    it('accepts valid comment within character limit', async () => {
      const user = userEvent.setup();

      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      const textarea = screen.getByLabelText(/Additional Information/i);
      const validComment = 'This is a valid comment';

      await user.type(textarea, validComment);

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalled();
      });
    });

    it('accepts exactly 256 characters', async () => {
      const user = userEvent.setup();

      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      const textarea = screen.getByLabelText(/Additional Information/i);
      const maxLengthComment = 'a'.repeat(256);

      await user.type(textarea, maxLengthComment);

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/Max Additional Information Length is 256 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Placeholder Randomization', () => {
    it('displays one of the predefined placeholders', () => {
      const possiblePlaceholders = [
        'LET ME IN!!!!',
        'I NEED ACCESS, LIKE YESTERDAY!!!!',
        'PLEASE SOMEBODY HELP ME!!!!',
        'I NEED TO GET IN!!!!',
        'I NEED ACCESS NOW!!!!',
      ];

      // Render multiple times to check randomization
      const placeholders = new Set();
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>
        );
        const textarea = screen.getByLabelText(/Additional Information/i);
        const placeholder = textarea.getAttribute('placeholder');
        placeholders.add(placeholder);
        unmount();
      }

      // At least one placeholder should be from the possible list
      const intersection = [...placeholders].filter(p => possiblePlaceholders.includes(p));
      expect(intersection.length).toBeGreaterThan(0);
    });
  });

  describe('Modal Props', () => {
    it('sets modal title correctly', () => {
      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      expect(screen.getByText('Request Access')).toBeInTheDocument();
    });

    it('does not show default modal footer', () => {
      render(<TestWrapper>{({ form }) => <RequestAccessModal {...defaultProps} form={form} />}</TestWrapper>);

      // Modal footer should be null (custom footer in form)
      const modal = document.querySelector('.ant-modal');
      const defaultFooter = modal?.querySelector('.ant-modal-footer');
      expect(defaultFooter).not.toBeInTheDocument();
    });
  });
});
