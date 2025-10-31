import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { handleError, handleSuccess } from '../common/handleResponse';
import { Table, Button, Space } from 'antd';
import breeService from '@/services/bree.service';

function ScheduledJobsPage() {
  const [jobs, setJobs] = useState({ loading: false, error: '', data: [] });

  useEffect(() => {
    // defining polling function
    const getScheduledJobs = async (stopPolling) => {
      try {
        setJobs((prev) => ({ ...prev, error: '' }));

        const response = await breeService.getAll();

        setJobs((prev) => ({ ...prev, data: response.jobs }));
      } catch (error) {
        console.log('Error fetch', error);
        setJobs((prev) => ({ ...prev, error: error.message }));
        stopPolling();
        handleError(error.message);
      }
    };

    const POLLING_INTERVAL = 5000; // will poll every 5s
    const polling = setInterval(() => {
      // define cleanup function
      const stopPolling = () => clearInterval(polling);
      getScheduledJobs(stopPolling);
    }, POLLING_INTERVAL);

    // on initial load
    getScheduledJobs();
    return () => clearInterval(polling);
  }, []);

  const changeStatus = async (action, record) => {
    try {
      setJobs((prev) => ({ ...prev, loading: true, error: '' }));

      // Call the appropriate service method
      if (action === 'stop') {
        await breeService.stopJob({ name: record.name });
      } else {
        await breeService.startJob({ name: record.name });
      }

      // Refresh the job list to get updated state
      const updatedJobs = await breeService.getAll();
      setJobs((prev) => ({ ...prev, loading: false, data: updatedJobs.jobs }));

      handleSuccess(`Job ${record.name} is ${action === 'stop' ? 'stopped' : 'started'}`);
    } catch (error) {
      console.log('Error fetch', error);
      setJobs((prev) => ({ ...prev, loading: false, error: error.message }));
      handleError(error.message);
    }
  };

  const removeJob = async (record) => {
    try {
      setJobs((prev) => ({ ...prev, loading: true, error: '' }));

      await breeService.removeJob({ name: record.name });

      // Refresh the job list to get updated state
      const updatedJobs = await breeService.getAll();
      setJobs((prev) => ({ ...prev, loading: false, data: updatedJobs.jobs }));

      handleSuccess(`Job ${record.name} is removed`);
    } catch (error) {
      console.log('Error fetch', error);
      setJobs((prev) => ({ ...prev, loading: false, error: error.message }));
      handleError(error.message);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Created At',
      key: 'createdAt',
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      render: (record) => {
        const timestamp = record.worker?.workerData?.WORKER_CREATED_AT;
        return timestamp ? new Date(timestamp).toLocaleString() : '';
      },
    },
    {
      title: 'Dataflow',
      key: 'dataflow',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (record) => {
        const dataflowId = record.worker?.workerData?.dataflowId;
        return dataflowId || '';
      },
    },
    {
      title: 'Interval',
      dataIndex: 'interval',
      key: 'interval',
    },
    {
      title: 'Cron',
      dataIndex: 'cron',
      key: 'cron',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Action',
      dataIndex: '',
      key: 'x',
      render: (record) => (
        <Space>
          <Button onClick={() => changeStatus('stop', record)} type="dashed">
            Stop
          </Button>
          <Button onClick={() => changeStatus('start', record)} type="primary">
            Start
          </Button>
          <Button danger onClick={() => removeJob(record)}>
            Remove
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      loading={jobs.loading}
      rowKey={(record) => record.name}
      dataSource={jobs.data}
      expandable={{
        expandedRowRender: (record) => <pre>{JSON.stringify(record, null, 2)}</pre>,
      }}
    />
  );
}

export default ScheduledJobsPage;
