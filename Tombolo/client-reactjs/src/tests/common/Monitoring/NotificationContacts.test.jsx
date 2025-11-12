/* eslint-disable */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
let mockState = {};
vi.mock('react-redux', () => ({
  useSelector: (sel) => sel(mockState),
}));
vi.mock('antd', () => ({
  Card: ({ children }) => <div>{children}</div>,
  Form: ({ children }) => <form>{children}</form>,
  notification: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() },
  message: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));
import NotificationContacts from '@/components/common/Monitoring/NotificationContacts.jsx';

vi.mock('@/components/common/Monitoring/AsrSpecificNotificationDetails', () => ({
  default: () => <div>ASR Extra</div>,
}));

vi.mock('@/components/common/Monitoring/../EmailTagInput', () => ({
  default: ({ label }) => <div>{label}</div>,
}));

describe('NotificationContacts', () => {
  it('shows ASR details when ASR integration present for current application', () => {
    mockState = {
      application: {
        application: { applicationId: 'app-1' },
        integrations: [{ name: 'ASR', application_id: 'app-1' }],
      },
    };

    render(<NotificationContacts form={{}} />);
    expect(screen.getByText('Primary Contact(s)')).toBeInTheDocument();
    expect(screen.getByText('ASR Extra')).toBeInTheDocument();
  });

  it('hides ASR details when no matching integration', () => {
    mockState = {
      application: {
        application: { applicationId: 'app-1' },
        integrations: [],
      },
    };

    render(<NotificationContacts form={{}} />);
    expect(screen.getByText('Primary Contact(s)')).toBeInTheDocument();
    expect(screen.queryByText('ASR Extra')).not.toBeInTheDocument();
  });
});
