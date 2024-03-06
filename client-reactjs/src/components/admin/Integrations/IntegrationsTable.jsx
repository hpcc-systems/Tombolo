/* eslint-disable unused-imports/no-unused-vars */
//Package imports
import React from 'react';
import { Table, Switch, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { message } from 'antd';

//Local Imports
import './integrations.css';
// eslint-disable-next-line unused-imports/no-unused-imports
import { toggleIntegration } from './integration-utils.js';

function IntegrationsTable({ allIntegrations, setAllIntegrations }) {
  const history = useHistory();

  // Handle integration active status change
  const handleToggleIntegrationStatus = async ({ record, active }) => {
    try {
      await toggleIntegration({ integrationId: record.id, active });

      // Updated integrations
      const updatedIntegrations = allIntegrations.map((integration) => {
        if (integration.id === record.id) {
          return { ...integration, active };
        }
        return integration;
      });

      setAllIntegrations(updatedIntegrations);
    } catch (error) {
      message.error('Failed to toggle integration', error);
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
        <div className="integrationTable__actionIcons">
          <Switch
            defaultChecked={record.active}
            size="small"
            onChange={(active) => handleToggleIntegrationStatus({ record, active })}
          />
          <Button
            type="link"
            size="small"
            icon={
              <SettingOutlined
                className={
                  record.active
                    ? 'integrationTable__actions-settings-icon-active'
                    : 'integrationTable__actions-settings-icon-inactive'
                }
              />
            }
            onClick={() => history.push(`/admin/integrations/${record.name}`)}></Button>
        </div>
      ),
    },
  ];

  return <Table size="small" columns={tableColumns} dataSource={allIntegrations} rowKey={(row) => row.id} />;
}

export default IntegrationsTable;
