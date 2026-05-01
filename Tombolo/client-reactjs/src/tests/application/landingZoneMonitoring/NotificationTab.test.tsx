import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Form, FormInstance } from 'antd';
import { act } from '@testing-library/react';

import NotificationTab from '@/components/application/LandingZoneMonitoring/AddEditModal/NotificationTab';

describe('LandingZoneMonitoring NotificationTab', () => {
  it('enforces required and email format validations', async () => {
    let capturedForm: FormInstance | undefined;

    const Wrapper: React.FC = () => {
      const [form] = Form.useForm() as unknown as [FormInstance, any];
      capturedForm = form;
      return <NotificationTab form={form} />;
    };

    render(<Wrapper />);

    await expect(capturedForm!.validateFields()).rejects.toBeTruthy();

    await act(async () => {
      capturedForm!.setFieldsValue({
        notifyOn: 'thresholdExceeded',
        notificationType: 'email',
        frequency: 10,
        toEmail: 'not-an-email',
      });
    });

    await expect(capturedForm!.validateFields()).rejects.toBeTruthy();

    await act(async () => {
      capturedForm!.setFieldsValue({
        toEmail: 'valid@example.com',
      });
    });

    await expect(capturedForm!.validateFields()).resolves.toBeTruthy();
  });
});
