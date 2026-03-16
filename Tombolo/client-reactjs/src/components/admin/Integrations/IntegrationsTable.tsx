import React from 'react';
import { Table, Switch, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { handleError } from '../../common/handleResponse';

import styles from './integrations.module.css';
import integrationsService from '@/services/integrations.service';
import { getAllActiveIntegrations } from '@/redux/slices/ApplicationSlice';

type Integration = any;

interface Props {
  allIntegrations: Integration[];
  setAllIntegrations?: (v: Integration[]) => void;
}

const IntegrationsTable: React.FC<Props> = ({ allIntegrations }) => {
  const history = useHistory();
  const dispatch = useDispatch<any>();

  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const integrations = useSelector((state: any) => state.application.integrations);

  const isIntegrationActive = ({
    integration_id,
    applicationId: appId,
  }: {
    integration_id: number;
    applicationId: any;
  }) => {
    return integrations.some((i: any) => i.integration_id === integration_id && i.application_id === appId);
  };

  const handleToggleIntegrationStatus = async ({
    record,
    active,
    application_id,
  }: {
    record: any;
    active: boolean;
    application_id: any;
  }) => {
    try {
      await integrationsService.toggle({ integrationId: record.id, application_id, active });
      dispatch(getAllActiveIntegrations());
    } catch (_error) {
      handleError('Failed to toggle integration');
    }
  };

  const tableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '10%',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (record: any) => (
        <div className={styles.integrationTable__actionIcons}>
          <Switch
            checked={isIntegrationActive({ integration_id: record.id, applicationId })}
            size="small"
            onChange={active => handleToggleIntegrationStatus({ record, application_id: applicationId, active })}
          />
          {isIntegrationActive({ integration_id: record.id, applicationId }) && (
            <Button type="link" size="small" onClick={() => history.push(`/admin/integrations/${record.name}`)}>
              <SettingOutlined />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return <Table size="small" columns={tableColumns} dataSource={allIntegrations} rowKey={row => row.id} />;
};

export default IntegrationsTable;
