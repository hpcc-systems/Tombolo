import React, { useEffect, useRef } from 'react';
import { Form, Select, Input } from 'antd';
import { matches } from 'validator';

const { Option } = Select;

function CostMonitoringBasicTab({ form, clusters, handleClusterChange, isDuplicating, isEditing, costMonitorings }) {
  const monitoringNameInputRef = useRef(null);

  // This is a temporary fix and only works on the application level
  const doesNameExist = (newName) => {
    return costMonitorings.some((monitoring) => monitoring.monitoringName === newName);
  };

  useEffect(() => {
    if (form && !isEditing) {
      monitoringNameInputRef.current?.input.focus();
    }

    if (isDuplicating) {
      let currentMonitoringName = form.getFieldValue('monitoringName');
      let newName = `copy-${currentMonitoringName}`;
      let copyCount = 1;

      // Keep incrementing until a unique name is found
      while (doesNameExist(newName)) {
        copyCount++;
        newName = `copy-${currentMonitoringName}-${copyCount}`;
      }

      form.setFields([
        {
          name: 'monitoringName',
          value: newName,
          warnings: ['Auto generated name. Please modify if necessary.'],
        },
      ]);
    }
  }, [isDuplicating, form, costMonitorings, isEditing]);

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        label="Monitoring Name"
        name="monitoringName"
        rules={[{ required: true, message: 'Please enter a monitoring name' }]}>
        <Input placeholder="Enter monitoring name" ref={monitoringNameInputRef} />
      </Form.Item>
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: 'Please enter a description' }]}>
        <Input.TextArea placeholder="Enter description" />
      </Form.Item>
      <Form.Item
        label="Clusters"
        name="clusterIds"
        rules={[{ required: true, message: 'Select at least one cluster' }]}>
        <Select mode="multiple" onChange={(value) => handleClusterChange(value)}>
          {clusters.map((cluster) => {
            return (
              <Option key={cluster.id} value={cluster.id}>
                {cluster.name}
              </Option>
            );
          })}
        </Select>
      </Form.Item>
      <Form.Item
        label="Users"
        name="users"
        rules={[
          {
            required: true,
            message: 'Enter at least one user',
            validator: (_, value) => {
              if (!value || value.length === 0) {
                return Promise.reject(new Error('Please add at least one email!'));
              }
              if (!value.every((v) => v === '*' || matches(v, '^[a-zA-Z0-9._-]+$'))) {
                return Promise.reject(new Error('Please enter only alphanumeric characters or "*"'));
              }

              return Promise.resolve();
            },
          },
        ]}>
        <Select
          mode="tags"
          allowClear
          placeholder="Enter a comma-delimited list of HPCC users"
          tokenSeparators={[',']}
        />
      </Form.Item>
    </Form>
  );
}

export default CostMonitoringBasicTab;
