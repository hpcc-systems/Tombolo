import { Form } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockState: any = {};
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(mockState),
}));

import AddEditCostMonitoringModal from '@/components/application/costMonitoring/AddEditCostMonitoringModal';

describe('AddEditCostMonitoringModal integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      application: {
        application: { applicationId: 'app-1' },
        integrations: [],
      },
    };
  });

  it('navigates from basic to notifications with real tabs/form behavior', async () => {
    const user = userEvent.setup();

    const Wrapper = () => {
      const [form] = Form.useForm();
      const [activeTab, setActiveTab] = React.useState('0');

      React.useEffect(() => {
        form.setFieldsValue({
          monitoringScope: 'clusters',
          clusterIds: ['c1'],
        });
      }, [form]);

      return (
        <AddEditCostMonitoringModal
          displayAddCostMonitoringModal={true}
          handleSaveCostMonitoring={vi.fn() as any}
          handleUpdateCostMonitoring={vi.fn() as any}
          form={form}
          clusters={[{ id: 'c1', name: 'Cluster One', currencyCode: 'EUR' }]}
          savingCostMonitoring={false}
          isEditing={false}
          isDuplicating={false}
          erroneousTabs={[]}
          resetStates={vi.fn()}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setErroneousTabs={vi.fn()}
          handleClusterChange={vi.fn()}
          costMonitorings={[] as any}
          domains={[]}
          productCategories={[]}
          selectedClusters={['c1']}
          setSelectedDomain={vi.fn()}
        />
      );
    };

    render(<Wrapper />);

    expect(screen.getByText('Add Cost Monitoring')).toBeInTheDocument();

    await user.click(screen.getByText('Next'));

    await screen.findByText('Cost Threshold');
    await waitFor(() => {
      expect(screen.getByText('€')).toBeInTheDocument();
      expect(screen.getByText('Per cluster')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Previous'));
    expect(screen.getByText('Monitor By')).toBeInTheDocument();
  });
});
