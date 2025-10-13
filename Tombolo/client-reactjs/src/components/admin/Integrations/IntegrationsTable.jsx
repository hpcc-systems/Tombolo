/* eslint-disable */
//Package imports
import React from 'react';
import { Table, Switch, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { handleError } from '../../common/handleResponse';

//Local Imports
import styles from './integrations.module.css';
import integrationsService from '@/services/integrations.service';

import { getAllActiveIntegrations } from '@/redux/slices/ApplicationSlice';

//JSX
function IntegrationsTable({ allIntegrations }) {
  const history = useHistory();
  const dispatch = useDispatch();

  // Get a list of active integrations and current app ID from the redux store
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const integrations = useSelector((state) => state.application.integrations);

  // Check if an integration is active
  const isIntegrationActive = ({ integration_id, applicationId }) => {
    return integrations.some((i) => i.integration_id === integration_id && i.application_id === applicationId);
  };

  // Handle integration active status change
  const handleToggleIntegrationStatus = async ({ record, active, application_id }) => {
    try {
      await integrationsService.toggle({ integrationId: record.id, application_id, active });
      // dispatch below actions so redux store gets fresh data
      dispatch(getAllActiveIntegrations());
    } catch (error) {
      handleError('Failed to toggle integration');
    }
  };

  //Constants
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
      render: (record) => (
        <div className={styles.integrationTable__actionIcons}>
          <Switch
            checked={isIntegrationActive({ integration_id: record.id, applicationId })}
            size="small"
            onChange={(active) => handleToggleIntegrationStatus({ record, application_id: applicationId, active })}
          />
          {(() => {
            return (
              isIntegrationActive({ integration_id: record.id, applicationId }) && (
                <Button type="link" size="small" onClick={() => history.push(`/admin/integrations/${record.name}`)}>
                  <SettingOutlined />
                </Button>
              )
            );
          })()}
        </div>
      ),
    },
  ];

  return <Table size="small" columns={tableColumns} dataSource={allIntegrations} rowKey={(row) => row.id} />;
}

export default IntegrationsTable;
