import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Form, FormInstance } from 'antd';

let mockState: any = {};
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(mockState),
}));

vi.mock('@/components/common/TagsInput', () => ({
  default: ({ placeholder }) => <input aria-label="tags-input" placeholder={placeholder} />,
}));

import NotificationTab from '@/components/application/clusterMonitoring/AddEditModal/NotificationTab';

describe('ClusterMonitoring NotificationTab', () => {
  it('renders ASR-specific contact fields only when ASR integration is enabled', () => {
    const Wrapper: React.FC = () => {
      const [form] = Form.useForm();
      return <NotificationTab form={form as unknown as FormInstance} />;
    };

    mockState = {
      application: {
        application: { applicationId: 'app-1' },
        integrations: [{ name: 'ASR', application_id: 'app-1' }],
      },
    };

    const { rerender } = render(<Wrapper />);

    expect(screen.getByText('Primary Contact(s)')).toBeInTheDocument();
    expect(screen.getByText('Secondary Contact(s)')).toBeInTheDocument();
    expect(screen.getByText('Notify Contact(s)')).toBeInTheDocument();

    mockState = {
      application: {
        application: { applicationId: 'app-1' },
        integrations: [],
      },
    };

    rerender(<Wrapper />);

    expect(screen.getByText('Primary Contact(s)')).toBeInTheDocument();
    expect(screen.queryByText('Secondary Contact(s)')).not.toBeInTheDocument();
    expect(screen.queryByText('Notify Contact(s)')).not.toBeInTheDocument();
  });
});
