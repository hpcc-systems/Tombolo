import React from 'react';
import { Form, Select } from 'antd';

const { Option } = Select;

function ClusterMonitoringBasicTab({
  clusters,
  handleClusterChange,
  selectedCluster,
  fetchingEngines,
  setSelectedEngines,
  engines,
}) {
  return (
    <>
      <Form.Item label="Cluster" name="cluster_id" rules={[{ required: true, message: 'Required filed' }]}>
        <Select onChange={(value) => handleClusterChange(value)}>
          {clusters.map((cluster) => {
            return (
              <Option key={cluster.id} value={cluster.id}>
                {cluster.name}
              </Option>
            );
          })}
        </Select>
      </Form.Item>

      {selectedCluster ? (
        <Form.Item label="Engine" name="monitoring_engines" rules={[{ required: true, message: 'Required filed' }]}>
          <Select
            loading={fetchingEngines}
            mode="multiple"
            onChange={(value) => {
              setSelectedEngines(value);
            }}>
            {engines.map((engine, index) => {
              return (
                <Option key={index} value={engine.Name}>
                  {engine.Name}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
      ) : null}
    </>
  );
}

export default ClusterMonitoringBasicTab;
