import React, { useEffect, useState } from 'react';
import { handleError, handleSuccess } from '../common/handleResponse';
import { Table, Button, Space } from 'antd';
import breeService from '@/services/bree.service';

interface JobState {
  loading: boolean;
  error: string;
  data: any[];
}

const ScheduledJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobState>({ loading: false, error: '', data: [] });

  useEffect(() => {
    const getScheduledJobs = async (stopPolling?: () => void) => {
      try {
        setJobs(prev => ({ ...prev, error: '' }));

        const response: any = await breeService.getAll();

        setJobs(prev => ({ ...prev, data: response.jobs }));
      } catch (error: any) {
        console.error('Error fetch', error);
        setJobs(prev => ({ ...prev, error: error.message }));
        stopPolling?.();
        handleError(error.message);
      }
    };

    const POLLING_INTERVAL = 5000; // will poll every 5s
    const polling = setInterval(() => {
      const stopPolling = () => clearInterval(polling);
      getScheduledJobs(stopPolling);
    }, POLLING_INTERVAL);

    // on initial load
    getScheduledJobs();
    return () => clearInterval(polling);
  }, []);

  const changeStatus = async (action: 'stop' | 'start', record: any) => {
    try {
      setJobs(prev => ({ ...prev, loading: true, error: '' }));

      if (action === 'stop') {
        await breeService.stopJob({ name: record.name });
      } else {
        await breeService.startJob({ name: record.name });
      }

      const updatedJobs: any = await breeService.getAll();
      setJobs(prev => ({ ...prev, loading: false, data: updatedJobs.jobs }));

      handleSuccess(`Job ${record.name} is ${action === 'stop' ? 'stopped' : 'started'}`);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.log('Error fetch', error);
      setJobs(prev => ({ ...prev, loading: false, error: error.message }));
      handleError(error.message);
    }
  };

  const removeJob = async (record: any) => {
    try {
      setJobs(prev => ({ ...prev, loading: true, error: '' }));

      await breeService.removeJob({ name: record.name });

      const updatedJobs: any = await breeService.getAll();
      setJobs(prev => ({ ...prev, loading: false, data: updatedJobs.jobs }));

      handleSuccess(`Job ${record.name} is removed`);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.log('Error fetch', error);
      setJobs(prev => ({ ...prev, loading: false, error: error.message }));
      handleError(error.message);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Created At',
      key: 'createdAt',
      sorter: (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      render: (record: any) => {
        const timestamp = record.worker?.workerData?.WORKER_CREATED_AT;
        return timestamp ? new Date(timestamp).toLocaleString() : '';
      },
    },
    {
      title: 'Dataflow',
      key: 'dataflow',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (record: any) => {
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
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Action',
      dataIndex: '',
      key: 'x',
      render: (record: any) => (
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
      rowKey={(record: any) => record.name}
      dataSource={jobs.data}
      expandable={{
        expandedRowRender: (record: any) => <pre>{JSON.stringify(record, null, 2)}</pre>,
      }}
    />
  );
};

export default ScheduledJobsPage;
