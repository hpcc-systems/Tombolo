import { Form } from 'antd';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockState: any = {};
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(mockState),
}));

import CostMonitoringBasicTab from '@/components/application/costMonitoring/CostMonitoringBasicTab';

describe('CostMonitoringBasicTab boundary validations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      application: {
        application: { applicationId: 'app-1' },
        integrations: [],
      },
    };
  });

  const renderTab = () => {
    let capturedForm: any;

    const Harness = () => {
      const [form] = Form.useForm();
      capturedForm = form;

      return (
        <CostMonitoringBasicTab
          form={form}
          clusters={[
            { id: 'c1', name: 'Cluster One', currencyCode: 'EUR' },
            { id: 'c2', name: 'Cluster Two', currencyCode: 'USD' },
          ]}
          handleClusterChange={vi.fn()}
          selectedClusters={['c1']}
          isDuplicating={false}
          isEditing={false}
          costMonitorings={[] as any}
          domains={[]}
          productCategories={[]}
          setSelectedDomain={vi.fn()}
        />
      );
    };

    render(<Harness />);
    return capturedForm;
  };

  it('rejects monitoring names over 100 characters', async () => {
    const form = renderTab();

    await act(async () => {
      form.setFieldsValue({
        monitoringName: 'a'.repeat(101),
        description: 'valid description text',
        monitoringScope: 'clusters',
        clusterIds: ['c1'],
      });
    });

    await expect(form.validateFields()).rejects.toMatchObject({
      errorFields: expect.arrayContaining([expect.objectContaining({ name: ['monitoringName'] })]),
    });
  });

  it('rejects descriptions shorter than 10 characters', async () => {
    const form = renderTab();

    await act(async () => {
      form.setFieldsValue({
        monitoringName: 'Valid Name',
        description: 'short',
        monitoringScope: 'clusters',
        clusterIds: ['c1'],
      });
    });

    await expect(form.validateFields()).rejects.toMatchObject({
      errorFields: expect.arrayContaining([expect.objectContaining({ name: ['description'] })]),
    });
  });

  it('rejects multi-cluster selection when currency codes differ', async () => {
    const form = renderTab();

    await act(async () => {
      form.setFieldsValue({
        monitoringName: 'Valid Name',
        description: 'valid description text',
        monitoringScope: 'clusters',
        clusterIds: ['c1', 'c2'],
      });
    });

    await expect(form.validateFields()).rejects.toMatchObject({
      errorFields: expect.arrayContaining([expect.objectContaining({ name: ['clusterIds'] })]),
    });
  });
});
