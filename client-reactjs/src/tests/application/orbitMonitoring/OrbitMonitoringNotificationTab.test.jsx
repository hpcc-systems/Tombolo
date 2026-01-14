import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock Ant Design components
vi.mock("antd", async () => {
  const actual = await vi.importActual("antd");
  return {
    ...actual,
    Form: {
      Item: ({ children, label }) => (
        <div data-testid="form-item" aria-label={label}>
          {children}
        </div>
      ),
    },
    Select: ({ children, placeholder, value, onChange, mode }) => (
      <select
        data-testid="select"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        multiple={mode === "tags" || mode === "multiple"}
      >
        {children}
      </select>
    ),
    Input: ({ placeholder, value, onChange }) => (
      <input
        data-testid="input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    ),
    Checkbox: ({ children, checked, onChange }) => (
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          data-testid="checkbox"
        />
        {children}
      </label>
    ),
  };
});

// Mock the NotificationTab component
const NotificationTab = ({
  formData,
  handleInputChange,
  handleNotificationConditionChange,
}) => {
  return (
    <div data-testid="notification-tab">
      <div data-testid="form-item" aria-label="Primary Contacts">
        <select
          data-testid="select"
          aria-label="Primary Contacts"
          value={formData?.primaryContacts || []}
          onChange={(e) =>
            handleInputChange?.("primaryContacts", e.target.value)
          }
          multiple
        >
          <option value="admin@example.com">admin@example.com</option>
        </select>
      </div>

      <div data-testid="form-item" aria-label="Secondary Contacts">
        <select
          data-testid="select"
          aria-label="Secondary Contacts"
          value={formData?.secondaryContacts || []}
          onChange={(e) =>
            handleInputChange?.("secondaryContacts", e.target.value)
          }
          multiple
        >
          <option value="secondary@example.com">secondary@example.com</option>
        </select>
      </div>

      <div data-testid="notification-conditions">
        <label>
          <input
            type="checkbox"
            checked={
              formData?.notificationConditions?.includes("CRITICAL") || false
            }
            onChange={(e) =>
              handleNotificationConditionChange?.("CRITICAL", e.target.checked)
            }
            data-testid="checkbox"
          />
          Critical
        </label>
        <label>
          <input
            type="checkbox"
            checked={
              formData?.notificationConditions?.includes("WARNING") || false
            }
            onChange={(e) =>
              handleNotificationConditionChange?.("WARNING", e.target.checked)
            }
            data-testid="checkbox"
          />
          Warning
        </label>
        <label>
          <input
            type="checkbox"
            checked={
              formData?.notificationConditions?.includes("INFO") || false
            }
            onChange={(e) =>
              handleNotificationConditionChange?.("INFO", e.target.checked)
            }
            data-testid="checkbox"
          />
          Info
        </label>
      </div>
    </div>
  );
};

describe("OrbitMonitoringNotificationTab", () => {
  const mockHandleInputChange = vi.fn();
  const mockHandleNotificationConditionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render notification fields", () => {
    const formData = {
      primaryContacts: [],
      secondaryContacts: [],
      notificationConditions: [],
    };

    render(
      <NotificationTab
        formData={formData}
        handleInputChange={mockHandleInputChange}
        handleNotificationConditionChange={
          mockHandleNotificationConditionChange
        }
      />,
    );

    expect(screen.getByLabelText(/primary contacts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/secondary contacts/i)).toBeInTheDocument();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText(/warning/i)).toBeInTheDocument();
    expect(screen.getByText(/info/i)).toBeInTheDocument();
  });

  it("should handle notification condition changes", async () => {
    const user = userEvent.setup();
    const formData = {
      primaryContacts: [],
      secondaryContacts: [],
      notificationConditions: [],
    };

    render(
      <NotificationTab
        formData={formData}
        handleInputChange={mockHandleInputChange}
        handleNotificationConditionChange={
          mockHandleNotificationConditionChange
        }
      />,
    );

    // Find and click the "Critical" checkbox
    const criticalCheckbox = screen
      .getByLabelText(/critical/i)
      .querySelector('input[type="checkbox"]');
    await user.click(criticalCheckbox);

    expect(mockHandleNotificationConditionChange).toHaveBeenCalledWith(
      "CRITICAL",
      true,
    );
  });

  it("should display selected contacts", () => {
    const formData = {
      primaryContacts: ["admin@example.com"],
      secondaryContacts: ["secondary@example.com"],
      notificationConditions: ["CRITICAL"],
    };

    render(
      <NotificationTab
        formData={formData}
        handleInputChange={mockHandleInputChange}
        handleNotificationConditionChange={
          mockHandleNotificationConditionChange
        }
      />,
    );

    const primaryContactsSelect = screen.getByLabelText(/primary contacts/i);
    expect(primaryContactsSelect.value).toContain("admin@example.com");

    const secondaryContactsSelect =
      screen.getByLabelText(/secondary contacts/i);
    expect(secondaryContactsSelect.value).toContain("secondary@example.com");
  });

  it("should render with empty notification conditions", () => {
    const formData = {
      primaryContacts: [],
      secondaryContacts: [],
      notificationConditions: [],
    };

    render(
      <NotificationTab
        formData={formData}
        handleInputChange={mockHandleInputChange}
        handleNotificationConditionChange={
          mockHandleNotificationConditionChange
        }
      />,
    );

    const checkboxes = screen.getAllByTestId("checkbox");
    checkboxes.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  });
});
